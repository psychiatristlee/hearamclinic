/**
 * Big 5 성격 검사 32개 유형의 캐릭터 이미지를 생성하여 Firebase Storage에 저장한다.
 * 사용: cd functions && GOOGLE_GENAI_API_KEY=... npx tsx scripts/generate-big5-characters.ts
 */
import {initializeApp, applicationDefault} from "firebase-admin/app";
import {getStorage} from "firebase-admin/storage";
import {genkit} from "genkit";
import {googleAI} from "@genkit-ai/google-genai";
import {TYPES} from "../../src/lib/test/big5/types";

const PROJECT_ID = "hearamclinic-ef507";
const apiKey = process.env.GOOGLE_GENAI_API_KEY;
if (!apiKey) {
  console.error("GOOGLE_GENAI_API_KEY 환경 변수가 필요합니다.");
  process.exit(1);
}

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
  storageBucket: `${PROJECT_ID}.firebasestorage.app`,
});

const ai = genkit({
  plugins: [googleAI({apiKey})],
});

function buildPrompt(typeName: string, tagline: string, summary: string): string {
  return `Create a single character portrait that represents this Korean personality archetype:

Type Name: "${typeName}"
Tagline: "${tagline}"
Description: "${summary}"

ART STYLE:
- Korean webtoon style (한국 웹툰), soft clean line art, gentle pastel colors
- Warm, comforting atmosphere appropriate for a mental health clinic
- Square 1:1 aspect, simple soft gradient or minimal contextual background

SUBJECT:
- A Korean person, age 20-35, shown from chest-up
- Modest, fully covered clothing (e.g., crew-neck shirt, sweater, blazer)
- Pose, facial expression, and small environmental details should reflect the archetype's traits described above
- The character should look approachable and authentic — not stylized as a stereotype

SAFETY (strict):
- No exposed skin, no cleavage, nothing sexually suggestive
- No grotesque, disturbing, violent, or unsettling imagery
- Even when depicting intense personalities, keep the tone gentle and humane

CRITICAL: The image must contain ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS, NO SYMBOLS, NO WRITING of any kind.`;
}

async function generateCharacterImage(
  typeName: string,
  tagline: string,
  summary: string,
): Promise<Buffer | null> {
  try {
    const response = await ai.generate({
      model: "googleai/gemini-2.5-flash-image",
      prompt: buildPrompt(typeName, tagline, summary),
      config: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    });
    if (response.media?.url) {
      const m = response.media.url.match(/^data:[^;]+;base64,(.+)$/);
      if (m) return Buffer.from(m[1], "base64");
    }
    return null;
  } catch (err) {
    console.error("이미지 생성 실패:", err);
    return null;
  }
}

async function uploadCharacter(buffer: Buffer, code: string): Promise<void> {
  const bucket = getStorage().bucket();
  const path = `personality/big5/${code}.png`;
  const file = bucket.file(path);
  await file.save(buffer, {
    metadata: {contentType: "image/png", cacheControl: "public, max-age=86400"},
  });
  // 공개 객체로 설정 → 토큰 없이 접근 가능
  await file.makePublic();
}

async function run() {
  const codes = Object.keys(TYPES);
  console.log(`총 ${codes.length}개 유형 처리 시작`);
  let success = 0;
  let failed = 0;
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i];
    const t = TYPES[code];
    console.log(`\n[${i + 1}/${codes.length}] ${code} - ${t.name}`);
    try {
      const buf = await generateCharacterImage(t.name, t.tagline, t.summary);
      if (!buf) {
        console.warn("  이미지 생성 실패, 다음으로");
        failed++;
        continue;
      }
      await uploadCharacter(buf, code);
      console.log(`  ✓ 업로드 완료 (${(buf.length / 1024).toFixed(0)}KB)`);
      success++;
    } catch (err) {
      console.error("  실패:", err);
      failed++;
    }
  }
  console.log(`\n완료: 성공 ${success}, 실패 ${failed}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
