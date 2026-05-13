/**
 * 애착 유형 4개 캐릭터 + 1개 커버 이미지 생성.
 * 사용: cd functions && GOOGLE_GENAI_API_KEY=... npx tsx scripts/generate-attachment-characters.ts
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

interface ImageJob {
  path: string;
  prompt: string;
}

const SAFETY = `
SAFETY (strict): No exposed skin, no cleavage, fully modestly clothed (crew-neck, sweater, blazer). No disturbing or distressing imagery. Even when depicting struggle, keep the tone gentle and humane.

CRITICAL: ABSOLUTELY NO TEXT, NO LETTERS, NO WORDS, NO NUMBERS, NO SYMBOLS, NO WRITING of any kind in the image.`;

const jobs: ImageJob[] = [
  {
    path: "personality/attachment/cover.png",
    prompt: `Create a wide cover illustration for an attachment style test.

CONCEPT: Two Korean people standing at a comfortable distance from each other, one slightly turned toward and one slightly turned away — symbolizing the dance between closeness and independence in relationships. Soft warm atmosphere, not lonely, not crowded. A few subtle floating heart-like motifs or warm light shapes around them.

ART STYLE: Korean webtoon style, soft pastel palette (lavender, warm cream, sage), gentle clean line art, dreamy and inviting.

LAYOUT: Wide landscape (16:9 feel), characters in soft balanced composition, generous negative space.
${SAFETY}`,
  },
  {
    path: "personality/attachment/secure.png",
    prompt: `Character portrait of "Secure Attachment" archetype.

CONCEPT: A Korean person (age 25-35), warm gentle expression, sitting comfortably with a slight open posture. They look at peace, neither clinging nor distant. The atmosphere is balanced and grounded.

ART STYLE: Korean webtoon, soft pastel, chest-up portrait, 1:1 square, soft gradient background in warm sage and cream tones.
${SAFETY}`,
  },
  {
    path: "personality/attachment/anxious.png",
    prompt: `Character portrait of "Anxious Attachment" archetype.

CONCEPT: A Korean person (age 25-35), looking attentive and gently worried, holding their phone close to their chest as if waiting for a reply. Their expression has warmth and longing. Not distressing, just thoughtful and a little vulnerable.

ART STYLE: Korean webtoon, soft pastel, chest-up portrait, 1:1 square, soft gradient background with warm rose and lavender tones.
${SAFETY}`,
  },
  {
    path: "personality/attachment/avoidant.png",
    prompt: `Character portrait of "Avoidant Attachment" archetype.

CONCEPT: A Korean person (age 25-35), calm and composed expression, reading a book alone by a window. They look self-contained and at ease in solitude. The mood is peaceful, not lonely.

ART STYLE: Korean webtoon, soft pastel, chest-up portrait, 1:1 square, soft gradient background with cool blue and gray tones.
${SAFETY}`,
  },
  {
    path: "personality/attachment/disorganized.png",
    prompt: `Character portrait of "Disorganized / Fearful-Avoidant Attachment" archetype.

CONCEPT: A Korean person (age 25-35), thoughtful and ambivalent expression, with one hand reaching slightly outward and the other gently pulled back to themselves — symbolizing the push-pull of wanting closeness yet fearing it. The atmosphere is gentle and reflective, not dark.

ART STYLE: Korean webtoon, soft pastel, chest-up portrait, 1:1 square, soft gradient background blending warm and cool tones.
${SAFETY}`,
  },
];

async function gen(prompt: string): Promise<Buffer | null> {
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
  let success = 0;
  let failed = 0;
  for (const job of jobs) {
    console.log(`\n${job.path}`);
    const buf = await gen(job.prompt);
    if (!buf) {
      console.warn("  실패");
      failed++;
      continue;
    }
    const file = bucket.file(job.path);
    await file.save(buf, {
      metadata: {contentType: "image/png", cacheControl: "public, max-age=86400"},
    });
    await file.makePublic();
    console.log(`  ✓ ${(buf.length / 1024).toFixed(0)}KB`);
    success++;
  }
  console.log(`\n완료: 성공 ${success}, 실패 ${failed}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
