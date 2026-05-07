/**
 * 에니어그램 9개 유형 캐릭터 이미지를 생성한다.
 * 사용: cd functions && GOOGLE_GENAI_API_KEY=... npx tsx scripts/generate-enneagram-characters.ts
 */
import {initializeApp, applicationDefault} from "firebase-admin/app";
import {getStorage} from "firebase-admin/storage";
import {genkit} from "genkit";
import {googleAI} from "@genkit-ai/google-genai";
import {TYPES} from "../../src/lib/test/enneagram/types";
import {EnneaType} from "../../src/lib/test/enneagram/questions";

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

const ai = genkit({plugins: [googleAI({apiKey})]});

function buildPrompt(name: string, tagline: string, summary: string): string {
  return `Create a single character portrait that represents this Korean Enneagram personality archetype.

Type Name: "${name}"
Tagline: "${tagline}"
Description: "${summary}"

ART STYLE: Korean webtoon style, soft pastel colors, gentle clean lines, 1:1 aspect, simple soft gradient or minimal contextual background.

SUBJECT: A Korean person, age 20-35, chest-up portrait. Modest fully covered clothing (crew neck, sweater, blazer). The pose, facial expression, and small environmental details directly reflect the archetype's traits. The character should look approachable and authentic.

SAFETY (strict): No exposed skin, no cleavage, fully clothed, no disturbing/violent imagery. Even when depicting strong personalities, keep the tone gentle and humane.

CRITICAL: ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS, NO SYMBOLS in the image.`;
}

async function generateImage(num: EnneaType): Promise<Buffer | null> {
  const t = TYPES[num];
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await ai.generate({
        model: "googleai/gemini-2.5-flash-image",
        prompt: buildPrompt(t.name, t.tagline, t.summary),
        config: {responseModalities: ["IMAGE", "TEXT"]},
      });
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

async function uploadCharacter(buffer: Buffer, num: EnneaType): Promise<void> {
  const bucket = getStorage().bucket();
  const path = `personality/enneagram/type-${num}.png`;
  const file = bucket.file(path);
  await file.save(buffer, {
    metadata: {contentType: "image/png", cacheControl: "public, max-age=86400"},
  });
  await file.makePublic();
}

async function run() {
  const nums: EnneaType[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  let success = 0;
  let failed = 0;
  for (const num of nums) {
    const t = TYPES[num];
    console.log(`\n[${num}/9] ${num}번 - ${t.name}`);
    const buf = await generateImage(num);
    if (!buf) {
      console.warn("  이미지 생성 실패");
      failed++;
      continue;
    }
    await uploadCharacter(buf, num);
    console.log(`  ✓ 업로드 완료 (${(buf.length / 1024).toFixed(0)}KB)`);
    success++;
  }
  console.log(`\n완료: 성공 ${success}, 실패 ${failed}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
