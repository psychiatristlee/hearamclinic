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

const SAFETY = `
SAFETY (strict): No exposed skin, modestly fully clothed (crew-neck, sweater, blazer). No disturbing imagery.
CRITICAL: ABSOLUTELY NO TEXT, LETTERS, NUMBERS, OR SYMBOLS in the image.`;

const jobs = [
  {
    path: "personality/disc/cover.png",
    prompt: `Cover illustration for a behavioral type test (DISC).

CONCEPT: Four Korean people, each in a distinctive posture representing one of four behavioral styles — one confident leader-like figure, one warm sociable figure, one calm steady figure, one thoughtful analytical figure. Arranged in a friendly group composition.

ART STYLE: Korean webtoon, soft pastel palette, gentle clean lines, warm grouping. 16:9 landscape feel, soft gradient background.
${SAFETY}`,
  },
  {
    path: "personality/disc/D.png",
    prompt: `Character portrait of "Dominance" (주도형) archetype.

CONCEPT: A confident Korean person (age 25-35), strong gentle expression, arms crossed or pointing forward decisively. Looks decisive but warm, not aggressive. Chest-up portrait.

ART STYLE: Korean webtoon, 1:1 square, warm red-orange gradient background symbolizing energy and drive.
${SAFETY}`,
  },
  {
    path: "personality/disc/I.png",
    prompt: `Character portrait of "Influence" (사교형) archetype.

CONCEPT: A bright, smiling Korean person (age 25-35), expressive open gesture (e.g., one hand raised in friendly greeting). Looks warm, sociable, and charismatic. Chest-up portrait.

ART STYLE: Korean webtoon, 1:1 square, sunny yellow-amber gradient background symbolizing warmth and sociability.
${SAFETY}`,
  },
  {
    path: "personality/disc/S.png",
    prompt: `Character portrait of "Steadiness" (안정형) archetype.

CONCEPT: A gentle, calm Korean person (age 25-35), soft smile, hands resting peacefully (e.g., holding a cup of tea or hands clasped). Looks reliable and warm. Chest-up portrait.

ART STYLE: Korean webtoon, 1:1 square, soft sage-green gradient background symbolizing stability and warmth.
${SAFETY}`,
  },
  {
    path: "personality/disc/C.png",
    prompt: `Character portrait of "Conscientiousness" (신중형) archetype.

CONCEPT: A thoughtful Korean person (age 25-35), focused gentle expression, perhaps lightly touching their chin in contemplation or looking at a notebook. Looks careful and precise. Chest-up portrait.

ART STYLE: Korean webtoon, 1:1 square, cool blue gradient background symbolizing analysis and precision.
${SAFETY}`,
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

run().catch((err) => { console.error(err); process.exit(1); });
