/**
 * DISC 블로그 글용 일러스트 6장 생성 + Firebase Storage 공개 업로드.
 * 사용: cd functions && GOOGLE_GENAI_API_KEY=... npx tsx scripts/generate-disc-blog-images.ts
 */
import {initializeApp, applicationDefault} from "firebase-admin/app";
import {getStorage} from "firebase-admin/storage";
import {genkit} from "genkit";
import {googleAI} from "@genkit-ai/google-genai";

const PROJECT_ID = "hearamclinic-ef507";
const BUCKET = `${PROJECT_ID}.firebasestorage.app`;
const FOLDER = "blog-images/disc-2026-06";

const apiKey = process.env.GOOGLE_GENAI_API_KEY;
if (!apiKey) {
  console.error("GOOGLE_GENAI_API_KEY 필요");
  process.exit(1);
}

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
  storageBucket: BUCKET,
});

const ai = genkit({
  plugins: [googleAI({apiKey})],
  promptDir: "./lib/features",
});

interface Section {
  filename: string;
  title: string;
  text: string;
}

// 블로그 6개 섹션에 어울리는 일러스트 의도. 각 sectionText는 generateImage.prompt에
// 그대로 전달되어 "이 주제를 구체적으로 그려라" 지시로 작동.
const SECTIONS: Section[] = [
  {
    filename: "01-intro.png",
    title: "도입 — DISC를 묻는 환자와 의사",
    text:
      "한국 정신과 진료실에서 환자가 'DISC 검사 결과를 받았는데 이걸 믿어도 되나요?'라고 부드럽게 묻고, 따뜻한 표정의 정신과 의사가 차분히 설명을 시작하려는 장면. MBTI에 이어 다양한 성격 유형 검사에 대해 사람들이 가지는 호기심을 차분히 다뤄 보려는 분위기. 진료실 책상 한쪽에 식물과 따뜻한 조명.",
  },
  {
    filename: "02-four-types.png",
    title: "DISC 네 글자 — 4가지 행동 양식",
    text:
      "현대 한국 사무실에서 네 명의 동료가 각기 다른 결로 일하고 있는 모습. 한 명은 결단력 있게 빠르게 결정을 내리고, 한 명은 옆 동료와 활기차게 대화하며 분위기를 띄우고, 한 명은 차분히 다른 사람의 이야기를 인내심 있게 들어주며, 한 명은 자료를 꼼꼼히 검토하고 있다. 네 사람의 다른 성격이 한 공간에서 자연스럽게 어우러지는 따뜻한 사무실. 다채롭지만 부드러운 파스텔 색감.",
  },
  {
    filename: "03-marston-history.png",
    title: "DISC의 뿌리 — 1928년 윌리엄 마스턴",
    text:
      "1920년대 후반 빈티지 분위기의 따뜻한 서재에서, 한 학자가 인간 감정에 관한 두꺼운 책을 펼쳐 두고 깊이 사색하는 모습. 책상에는 빈티지 만년필과 노트, 양옆의 책꽂이에는 가죽 표지의 두꺼운 책들이 가득하다. 창문으로 들어오는 황금빛 햇살이 책상을 부드럽게 비추는 분위기. 과거 한 사람의 통찰이 오늘날 도구의 시작이 되었다는 결.",
  },
  {
    filename: "04-workplace-collaboration.png",
    title: "직장과 협업 — 다른 결의 사람들이 한 자리에",
    text:
      "한국 회사 회의실에서 다양한 성격 스타일의 동료들이 한 테이블에 둘러앉아 따뜻한 분위기로 협업하는 장면. 누군가는 화이트보드 앞에서 아이디어를 설명하고, 누군가는 노트북으로 자료를 정리하고, 누군가는 미소 지으며 듣고 있다. 서로 다른 결의 사람들이 각자의 강점으로 함께 일할 때의 어우러짐. 창가에 식물, 부드러운 자연광.",
  },
  {
    filename: "05-psychiatrist-advice.png",
    title: "정신과 의사로서 — 솔직한 한 마디",
    text:
      "한국 정신과 진료실에서 정신과 의사가 환자 옆에 앉아 따뜻한 어조로 차분히 이야기하는 모습. 의사는 단정한 흰 가운 차림이지만 표정은 부드럽고 공감 어린 분위기. 환자는 편안하게 듣고 있다. DISC 같은 검사는 도구일 뿐, 의학적 진단을 대체하지 않는다는 신중한 안내의 분위기. 차분한 진료실, 창가에 식물.",
  },
  {
    filename: "06-mirror-self-reflection.png",
    title: "마무리 — 나를 비추는 거울",
    text:
      "한국 사람이 따뜻한 방 안에서 큰 거울 앞에 차분히 서서 자기 자신을 바라보는 모습. 거울 속에는 그 사람의 모습이 부드러운 빛으로 비친다. 자기 이해와 성찰의 분위기. 도구는 거울일 뿐 사람을 가두지 않는다는 결을 시각적으로 표현. 창문으로 들어오는 부드러운 자연광, 잔잔하고 평온한 분위기.",
  },
];

async function generateImage(sectionText: string): Promise<Buffer | null> {
  const prompt = ai.prompt("generate-image/generateImage");
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await prompt({sectionText: sectionText.slice(0, 500)});
      if (response.media?.url) {
        const m = response.media.url.match(/^data:[^;]+;base64,(.+)$/);
        if (m) return Buffer.from(m[1], "base64");
      }
    } catch (err) {
      console.warn(`  attempt ${attempt + 1} 실패:`, (err as Error).message);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  return null;
}

async function uploadPublic(buf: Buffer, filename: string): Promise<string> {
  const bucket = getStorage().bucket();
  const path = `${FOLDER}/${filename}`;
  const file = bucket.file(path);
  await file.save(buf, {
    metadata: {
      contentType: "image/png",
      cacheControl: "public, max-age=86400",
    },
  });
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${path}`;
}

async function run() {
  console.log("DISC 블로그 일러스트 6장 생성 시작\n");
  const out: Array<{section: Section; url: string; size: number}> = [];
  const failed: Section[] = [];

  for (let i = 0; i < SECTIONS.length; i++) {
    const sec = SECTIONS[i];
    console.log(`[${i + 1}/${SECTIONS.length}] ${sec.filename} — ${sec.title}`);
    const buf = await generateImage(sec.text);
    if (!buf) {
      console.warn(`  ✗ 생성 실패`);
      failed.push(sec);
      continue;
    }
    const url = await uploadPublic(buf, sec.filename);
    console.log(`  ✓ ${(buf.length / 1024).toFixed(0)}KB → ${url}`);
    out.push({section: sec, url, size: buf.length});
  }

  console.log("\n=== 결과 요약 ===");
  console.log(`성공: ${out.length} / ${SECTIONS.length}`);
  if (failed.length > 0) {
    console.log("실패:");
    failed.forEach((s) => console.log(`  - ${s.filename}`));
  }
  console.log("\n=== 공개 다운로드 URL ===");
  out.forEach((r) => {
    console.log(`\n${r.section.title}`);
    console.log(`  파일: ${r.section.filename}`);
    console.log(`  URL : ${r.url}`);
  });
}

run().catch((err) => {
  console.error("스크립트 실행 실패:", err);
  process.exit(1);
});
