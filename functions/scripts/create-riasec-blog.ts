/**
 * RIASEC 직업흥미 검사 블로그 1편 + 섹션별 이미지 생성/게시.
 * 사용: cd functions && GOOGLE_GENAI_API_KEY=... npx tsx scripts/create-riasec-blog.ts
 */
import {readFileSync} from "fs";
import {join} from "path";
import {initializeApp, applicationDefault} from "firebase-admin/app";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import {randomUUID} from "crypto";
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
const ai = genkit({plugins: [googleAI({apiKey})], promptDir: "./lib/features"});

const SLUG = "riasec-career-interest-test-guide";
const TITLE = "직업흥미 검사(RIASEC)로 나에게 맞는 진로 찾기: 홀랜드 6유형 완전 가이드";
const CATEGORY = "성격";
const BODY = readFileSync(join(__dirname, "riasec-blog-body.md"), "utf-8");

function splitSections(markdown: string): string[] {
  const lines = markdown.split("\n");
  const sections: string[] = [];
  let current = "";
  for (const line of lines) {
    if (line.startsWith("## ") && current.trim()) {
      sections.push(current.trim());
      current = line + "\n";
    } else {
      current += line + "\n";
    }
  }
  if (current.trim()) sections.push(current.trim());
  return sections;
}

async function generateImage(sectionText: string): Promise<Buffer | null> {
  try {
    const prompt = ai.prompt("generate-image/generateImage");
    const response = await prompt({sectionText: sectionText.slice(0, 500)});
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

function makeDownloadUrl(b: string, p: string, t: string): string {
  const e = encodeURIComponent(p)
    .replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/!/g, "%21").replace(/'/g, "%27");
  return `https://firebasestorage.googleapis.com/v0/b/${b}/o/${e}?alt=media&token=${t}`;
}

async function uploadImage(buf: Buffer, slug: string, idx: number): Promise<string> {
  const bucket = getStorage().bucket();
  const path = `blog-images/posts/${slug}/section-${idx}.png`;
  const file = bucket.file(path);
  const token = randomUUID();
  await file.save(buf, {metadata: {contentType: "image/png", metadata: {firebaseStorageDownloadTokens: token}}});
  return makeDownloadUrl(bucket.name, path, token);
}

function buildExcerpt(c: string): string {
  return c.replace(/!\[[^\]]*\]\([^)]+\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/#+\s/g, "")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\n+/g, " ").trim().slice(0, 200);
}

async function ensureCategory(name: string): Promise<void> {
  const db = getFirestore();
  const snap = await db.collection("categories").get();
  if (snap.docs.some((d) => (d.data().name as string) === name)) return;
  await db.collection("categories").add({name, order: snap.size, createdAt: Timestamp.now()});
}

async function run() {
  await ensureCategory(CATEGORY);
  const db = getFirestore();
  const ref = db.collection("posts").doc(SLUG);
  const bucket = getStorage().bucket();
  const [existing] = await bucket.getFiles({prefix: `blog-images/posts/${SLUG}/`});
  for (const f of existing) { try { await f.delete(); } catch { /* ignore */ } }

  const sections = splitSections(BODY);
  console.log(`섹션 수: ${sections.length}`);
  const withImages: string[] = [];
  let idx = 0;
  for (let i = 0; i < sections.length; i++) {
    const s = sections[i];
    console.log(`  [${i + 1}/${sections.length}] 이미지...`);
    const buf = await generateImage(s);
    if (buf) {
      idx++;
      const url = await uploadImage(buf, SLUG, idx);
      console.log("    ✓");
      withImages.push(s + `\n\n![](${url})`);
    } else {
      console.warn("    실패");
      withImages.push(s);
    }
  }
  const final = withImages.join("\n\n");
  const m = final.match(/https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^\s"<>)]+\?alt=media&token=[a-f0-9-]+/);
  const featuredImage = m?.[0] ?? "";

  await ref.set({
    title: TITLE,
    slug: SLUG,
    content: final,
    excerpt: buildExcerpt(final),
    date: Timestamp.now(),
    categories: [CATEGORY],
    featuredImage,
    author: "해람정신건강의학과",
    updatedAt: Timestamp.now(),
  });
  console.log(`\n✓ ${SLUG} 저장 완료 (섹션 ${sections.length}, 이미지 ${idx})`);
}

run().catch((err) => { console.error(err); process.exit(1); });
