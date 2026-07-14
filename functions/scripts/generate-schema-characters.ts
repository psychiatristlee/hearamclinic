import {initializeApp, applicationDefault} from "firebase-admin/app";
import {getStorage} from "firebase-admin/storage";
import {genkit} from "genkit";
import {googleAI} from "@genkit-ai/google-genai";

const PROJECT_ID = "hearamclinic-ef507";
const apiKey = process.env.GOOGLE_GENAI_API_KEY;
if (!apiKey) { console.error("GOOGLE_GENAI_API_KEY 필요"); process.exit(1); }

initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
  storageBucket: `${PROJECT_ID}.firebasestorage.app`,
});
const ai = genkit({plugins: [googleAI({apiKey})]});

// 심리도식 검사: 커버 + 5개 도식영역(DR/IA/IL/OD/OI) 치유적 일러스트
const jobs: Array<{path: string; prompt: string}> = [
  {
    path: "personality/schema/cover.png",
    prompt: "A gentle young Korean person sitting curled by a large softly glowing window at dawn, hand resting over heart, wrapped in a cozy blanket, surrounded by floating warm light and delicate leaves, serene reflective expression, character-centered, NO text/letters/numbers/symbols, Korean webtoon style, soft pastel, warm healing tone.",
  },
  {
    path: "personality/schema/DR.png",
    prompt: "A lonely young Korean child standing in soft mist reaching toward a warm glowing hand of light extending gently toward them, tender hopeful expression, distance closing into connection, blush pastels and golden warmth embracing the figure, character-centered, NO text/letters/numbers/symbols, Korean webtoon style, soft pastel, warm healing tone.",
  },
  {
    path: "personality/schema/IA.png",
    prompt: "A small brave young Korean figure taking a first hesitant step across a gentle bridge of light, letting go of a supportive hand, standing a little taller with quiet courage, dawn glow ahead, tender determined face, character-centered, NO text/letters/numbers/symbols, Korean webtoon style, soft pastel, warm healing tone.",
  },
  {
    path: "personality/schema/IL.png",
    prompt: "A calm young Korean person seated in balanced stillness cradling a single softly glowing orb, surrounded by gently orbiting petals in harmony, peaceful centered expression, muted lavender and cream tones evoking gentle restraint, character-centered, NO text/letters/numbers/symbols, Korean webtoon style, soft pastel, warm healing tone.",
  },
  {
    path: "personality/schema/OD.png",
    prompt: "A tender young Korean figure gently wrapping a warm blanket around their own shoulders, cupping a small warm light close to their chest, turning attention softly inward, gentle self-compassionate smile, cozy peach and honey hues, character-centered, NO text/letters/numbers/symbols, Korean webtoon style, soft pastel, warm healing tone.",
  },
  {
    path: "personality/schema/OI.png",
    prompt: "A relaxed young Korean person leaning back with eyes softly closed and shoulders finally loosening, exhaling as tension dissolves into drifting soft petals and warm air, open serene face, airy sky-blue and cream tones, character-centered, NO text/letters/numbers/symbols, Korean webtoon style, soft pastel, warm healing tone.",
  },
];

async function gen(prompt: string): Promise<Buffer | null> {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await ai.generate({
        model: "googleai/gemini-2.5-flash-image",
        prompt,
        config: {responseModalities: ["IMAGE", "TEXT"]},
      });
      if (r.media?.url) {
        const m = r.media.url.match(/^data:[^;]+;base64,(.+)$/);
        if (m) return Buffer.from(m[1], "base64");
      }
    } catch (e) { console.warn(`  ${i + 1} 시도 실패:`, (e as Error).message); }
    await new Promise((res) => setTimeout(res, 2000));
  }
  return null;
}

async function run() {
  const bucket = getStorage().bucket();
  let ok = 0, fail = 0;
  for (const j of jobs) {
    console.log(`\n${j.path}`);
    const buf = await gen(j.prompt);
    if (!buf) { console.warn("  실패"); fail++; continue; }
    const file = bucket.file(j.path);
    await file.save(buf, {metadata: {contentType: "image/png", cacheControl: "public, max-age=86400"}});
    await file.makePublic();
    console.log(`  ✓ ${(buf.length / 1024).toFixed(0)}KB`);
    ok++;
  }
  console.log(`\n완료: ${ok} 성공, ${fail} 실패`);
}

run().catch((e) => { console.error(e); process.exit(1); });
