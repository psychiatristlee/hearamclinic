/**
 * 자동 생성된 블로그 글의 톤을 더 사람답게 다듬는 1회성 스크립트.
 * 대상: author == "해람정신건강의학과" 인 모든 글 (cron + batch)
 *
 * 사용: cd functions && GOOGLE_GENAI_API_KEY=... npx tsx scripts/rewrite-blog-tone.ts
 */
import {initializeApp, applicationDefault} from "firebase-admin/app";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {GoogleGenAI} from "@google/genai";

const PROJECT_ID = "hearamclinic-ef507";
const apiKey = process.env.GOOGLE_GENAI_API_KEY;
if (!apiKey) {
  console.error("GOOGLE_GENAI_API_KEY 필요");
  process.exit(1);
}

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
});

const ai = new GoogleGenAI({apiKey});

const PROMPT_TEMPLATE = (title: string, content: string) => `당신은 정신건강의학과 전문의 블로그 글의 톤을 사람답게 다듬는 한국어 편집 전문가입니다.

[원본 글 제목]
${title}

[원본 글 본문]
${content}

[다듬는 방향]
- 정신건강의학과 의사가 진료실 한쪽에서 차분히 적은 듯한 자연스러운 한국어 존댓말로
- 종결 어미를 다양화하세요. "~합니다" 일변도 → "~죠", "~네요", "~인데요", "~데요", "~겠죠", "~답니다", "~지요", "~합니다만", "~군요", "~지 않을까요" 등을 자연스럽게 섞기
- 문장 길이를 다양하게 (짧은 문장도 가끔)
- "진료실에서 이런 이야기를 자주 듣습니다" 같은 진부한 도입어, "~하는 것이 중요합니다" 같은 교과서적 마무리는 피하기
- 의학 정보 전달은 정확하게 유지하되, 단정적·딱딱한 표현은 부드럽게
- 의사가 한 명의 사람으로서 환자에게 말하듯이

[엄격히 지킬 것]
- 마크다운 구조: #, ##, ###, 이미지 ![](url)을 100% 그대로 보존 (순서·URL·alt 텍스트 일체 변경 금지)
- 의학적 사실·진단 기준·약 정보 변경 금지
- 새로운 정보 추가 금지
- 본문 분량은 원본의 ±20% 이내
- 반말 절대 금지. 모든 문장 종결은 존댓말
- 이탤릭(*...*), 볼드(**...**), 취소선(~~...~~) 사용 금지
- 물결표(~) 사용 금지. 범위는 "에서"나 "-"로
- 본문 외 인사말·서두 안내·코드블록 사용 금지

수정된 마크다운 본문만 그대로 출력하세요. 다른 설명·인사말 일체 없이.`;

async function rewriteContent(
  title: string,
  content: string,
): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: PROMPT_TEMPLATE(title, content),
  });
  const text = (response.text ?? "").trim();
  if (!text) throw new Error("빈 응답");
  // 응답이 ```markdown 으로 시작하는 경우 제거
  return text
    .replace(/^```(?:markdown|md)?\s*\n?/i, "")
    .replace(/\n?```\s*$/i, "")
    .trim();
}

function buildExcerpt(content: string): string {
  return content
    .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/#+\s/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, 200);
}

async function run() {
  const db = getFirestore();
  const snap = await db
    .collection("posts")
    .where("author", "==", "해람정신건강의학과")
    .get();

  console.log(`대상 글: ${snap.size}개`);

  let success = 0;
  let failed = 0;
  const failedSlugs: string[] = [];

  for (let i = 0; i < snap.docs.length; i++) {
    const doc = snap.docs[i];
    const data = doc.data();
    const title = data.title as string;
    const content = data.content as string;
    const slug = doc.id;

    console.log(`\n[${i + 1}/${snap.size}] ${title.slice(0, 50)}...`);

    try {
      const newContent = await rewriteContent(title, content);

      // 이미지 URL 보존 여부 간단 검증 — 이미지 개수가 줄어들면 거부
      const originalImageCount = (content.match(/!\[[^\]]*\]\([^)]+\)/g) || [])
        .length;
      const newImageCount = (newContent.match(/!\[[^\]]*\]\([^)]+\)/g) || [])
        .length;
      if (newImageCount < originalImageCount) {
        console.warn(
          `  ⚠ 이미지 개수가 줄었음 (${originalImageCount} → ${newImageCount}), 건너뜀`,
        );
        failed++;
        failedSlugs.push(slug);
        continue;
      }

      // 분량 검증 (50% 이하 또는 200% 이상이면 거부)
      const ratio = newContent.length / content.length;
      if (ratio < 0.5 || ratio > 2.0) {
        console.warn(
          `  ⚠ 분량 비율 이상 (${ratio.toFixed(2)}), 건너뜀`,
        );
        failed++;
        failedSlugs.push(slug);
        continue;
      }

      await doc.ref.update({
        content: newContent,
        excerpt: buildExcerpt(newContent),
        updatedAt: Timestamp.now(),
        toneRewrittenAt: Timestamp.now(),
      });

      console.log(`  ✓ ${content.length}자 → ${newContent.length}자`);
      success++;
    } catch (err) {
      console.error("  ✗ 실패:", (err as Error).message);
      failed++;
      failedSlugs.push(slug);
    }

    // Rate limit 보호 — 1초 대기
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n완료: 성공 ${success}, 실패 ${failed}`);
  if (failedSlugs.length > 0) {
    console.log("\n실패한 slug:");
    failedSlugs.forEach((s) => console.log(`  - ${s}`));
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
