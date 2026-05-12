/**
 * 성격 검사 카드 커버 이미지 (Big 5, 에니어그램) 생성.
 * 사용: cd functions && GOOGLE_GENAI_API_KEY=... npx tsx scripts/generate-personality-covers.ts
 */
import {initializeApp, applicationDefault} from "firebase-admin/app";
import {getStorage} from "firebase-admin/storage";
import {genkit} from "genkit";
import {googleAI} from "@genkit-ai/google-genai";

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

const covers: Array<{path: string; prompt: string}> = [
  {
    path: "personality/big5/cover.png",
    prompt: `Create a clean cover illustration for a personality test card.

CONCEPT: Five facets of one person's personality. Show a Korean person (age 20-35), thoughtful and warm expression, with five soft pastel-colored gentle radial elements or floating bubbles around them — each representing a different inner trait. The composition feels like an introspective moment of self-understanding.

ART STYLE: Korean webtoon style, soft pastel palette (lavender, soft pink, warm yellow, sage green, sky blue), gentle clean line art, dreamy and inviting atmosphere.

LAYOUT: Wide landscape composition (16:9 ratio feel), character slightly off-center, generous negative space, simple background gradient.

SAFETY: Modest fully-covered clothing, no exposed skin, warm and welcoming tone.

CRITICAL: ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS, NO SYMBOLS, NO WRITING of any kind in the image.`,
  },
  {
    path: "personality/enneagram/cover.png",
    prompt: `Create a clean cover illustration for an Enneagram personality test card.

CONCEPT: Nine different Korean people (age 20-35) gathered together, each with a distinct posture and gentle expression that hints at a different personality archetype. They form a loose circular or grouped composition, conveying the idea of nine different ways of being human. Warm community feeling.

ART STYLE: Korean webtoon style, soft pastel palette, gentle clean line art, harmonious and warm atmosphere.

LAYOUT: Wide landscape composition (16:9 ratio feel), characters arranged with breathing room, soft gradient background.

SAFETY: All characters in modest fully-covered clothing, no exposed skin, no stereotyping, every face shown with dignity and warmth.

CRITICAL: ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS, NO SYMBOLS, NO WRITING of any kind in the image.`,
  },
];

async function generate(prompt: string): Promise<Buffer | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await ai.generate({
        model: "googleai/gemini-2.5-flash-image",
        prompt,
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

async function run() {
  const bucket = getStorage().bucket();
  for (const c of covers) {
    console.log(`\n${c.path}`);
    const buf = await generate(c.prompt);
    if (!buf) {
      console.warn("  실패");
      continue;
    }
    const file = bucket.file(c.path);
    await file.save(buf, {
      metadata: {contentType: "image/png", cacheControl: "public, max-age=86400"},
    });
    await file.makePublic();
    console.log(`  ✓ ${(buf.length / 1024).toFixed(0)}KB`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
