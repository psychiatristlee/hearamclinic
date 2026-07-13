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

const jobs: Array<{path: string; prompt: string}> = [
  {
    path: "personality/riasec/cover.png",
    prompt: "A warm gathering of diverse young Korean people of different interests standing together, each holding a symbolic object of their passion, smiling with curiosity and hope, gentle sunlight, dreamy atmosphere of self-discovery, character-centered, warm tone, NO text/letters/numbers/symbols, Korean webtoon style, soft pastel palette of cream, peach and light blue.",
  },
  {
    path: "personality/riasec/R.png",
    prompt: "A young Korean person in workshop overalls kneeling beside a wooden workbench, confidently tightening a bolt on a hand-built machine, sleeves rolled up, focused and satisfied expression, scattered tools and gears around, hands-on maker energy, character-centered, warm tone, NO text/letters/numbers/symbols, Korean webtoon style, soft pastel palette of olive green, warm brown and amber.",
  },
  {
    path: "personality/riasec/I.png",
    prompt: "A curious young Korean person leaning over a microscope in a bright lab, one eye squinting through the lens, floating abstract molecular shapes and a small plant sample nearby, thoughtful analytical expression, spirit of discovery, character-centered, warm tone, NO text/letters/numbers/symbols, Korean webtoon style, soft pastel palette of cool blue, teal and pale mint.",
  },
  {
    path: "personality/riasec/A.png",
    prompt: "A young Korean artist seated at an easel, brush in hand mid-stroke, paint smudges on cheeks, surrounded by floating colorful splashes and a musical mood, eyes glowing with imaginative joy, expressive creative aura, character-centered, warm tone, NO text/letters/numbers/symbols, Korean webtoon style, soft pastel palette of lavender, rose pink and lilac.",
  },
  {
    path: "personality/riasec/S.png",
    prompt: "A gentle young Korean person leaning forward with a caring smile, holding another person's hands to comfort and encourage them, warm eye contact and open posture radiating empathy, supportive helping atmosphere, character-centered, warm tone, NO text/letters/numbers/symbols, Korean webtoon style, soft pastel palette of warm coral, peach and honey yellow.",
  },
  {
    path: "personality/riasec/E.png",
    prompt: "A confident young Korean person standing tall mid-presentation, one hand gesturing persuasively, bright charismatic smile leading an unseen small group, dynamic ambitious posture radiating leadership energy, character-centered, warm tone, NO text/letters/numbers/symbols, Korean webtoon style, soft pastel palette of warm red, coral and golden orange.",
  },
  {
    path: "personality/riasec/C.png",
    prompt: "A tidy young Korean person at a neatly organized desk, carefully arranging color-coded folders and stacking papers into perfect order, calm precise expression, everything aligned and structured, methodical detail-oriented mood, character-centered, warm tone, NO text/letters/numbers/symbols, Korean webtoon style, soft pastel palette of soft sky blue, mint green and cream.",
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
