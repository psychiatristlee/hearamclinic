/**
 * 기존 블로그 포스트에 섹션별 이미지를 생성하여 추가하는 일회성 스크립트.
 * 사용: cd functions && npx tsx scripts/add-images-to-post.ts <slug>
 */
import {initializeApp, applicationDefault} from "firebase-admin/app";
import {getFirestore, Timestamp} from "firebase-admin/firestore";
import {getStorage} from "firebase-admin/storage";
import {randomUUID} from "crypto";
import {genkit} from "genkit";
import {googleAI} from "@genkit-ai/google-genai";

const PROJECT_ID = "hearamclinic-ef507";
const SLUG = process.argv[2];
if (!SLUG) {
  console.error("usage: npx tsx scripts/add-images-to-post.ts <slug>");
  process.exit(1);
}

const apiKey = process.env.GOOGLE_GENAI_API_KEY;
if (!apiKey) {
  console.error("GOOGLE_GENAI_API_KEY 환경 변수가 필요합니다.");
  process.exit(1);
}

const app = initializeApp({
  credential: applicationDefault(),
  projectId: PROJECT_ID,
  storageBucket: `${PROJECT_ID}.firebasestorage.app`,
});

const ai = genkit({
  plugins: [googleAI({apiKey})],
  promptDir: "./lib/features",
});

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

function makeDownloadUrl(
  bucketName: string,
  storagePath: string,
  token: string,
): string {
  const encoded = encodeURIComponent(storagePath)
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/!/g, "%21")
    .replace(/'/g, "%27");
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encoded}?alt=media&token=${token}`;
}

async function uploadImage(
  buffer: Buffer,
  slug: string,
  index: number,
): Promise<string> {
  const bucket = getStorage().bucket();
  const storagePath = `blog-images/posts/${slug}/section-${index}.png`;
  const file = bucket.file(storagePath);
  const downloadToken = randomUUID();
  await file.save(buffer, {
    metadata: {
      contentType: "image/png",
      metadata: {firebaseStorageDownloadTokens: downloadToken},
    },
  });
  return makeDownloadUrl(bucket.name, storagePath, downloadToken);
}

async function run() {
  const db = getFirestore();
  const ref = db.collection("posts").doc(SLUG);
  const snap = await ref.get();
  if (!snap.exists) {
    console.error("post not found:", SLUG);
    process.exit(1);
  }
  const data = snap.data()!;
  const originalContent = data.content as string;

  // 기존 이미지 마크다운 제거
  const cleaned = originalContent.replace(/\n\n!\[[^\]]*\]\([^)]+\)/g, "");

  // Storage 기존 이미지 삭제
  const bucket = getStorage().bucket();
  const [existing] = await bucket.getFiles({prefix: `blog-images/posts/${SLUG}/`});
  for (const f of existing) {
    try {
      await f.delete();
      console.log("삭제:", f.name);
    } catch (err) {
      console.warn("삭제 실패:", f.name, err);
    }
  }

  const sections = splitSections(cleaned);
  console.log(`섹션 수: ${sections.length}`);

  const sectionsWithImages: string[] = [];
  let imageIndex = 0;

  // 인트로 섹션
  if (sections.length > 0) {
    console.log(`[1/${sections.length}] 인트로 이미지 생성 중...`);
    const buf = await generateImage(sections[0]);
    if (buf) {
      imageIndex++;
      const url = await uploadImage(buf, SLUG, imageIndex);
      console.log("  업로드:", url);
      sectionsWithImages.push(sections[0] + `\n\n![](${url})`);
    } else {
      console.warn("  실패, 이미지 없이 진행");
      sectionsWithImages.push(sections[0]);
    }
  }

  // h2 섹션들
  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    if (
      section.startsWith("## 참고 문헌") ||
      section.startsWith("## 참고 자료")
    ) {
      sectionsWithImages.push(section);
      continue;
    }
    console.log(`[${i + 1}/${sections.length}] 섹션 이미지 생성 중...`);
    const buf = await generateImage(section);
    if (buf) {
      imageIndex++;
      const url = await uploadImage(buf, SLUG, imageIndex);
      console.log("  업로드:", url);
      sectionsWithImages.push(section + `\n\n![](${url})`);
    } else {
      console.warn("  실패, 이미지 없이 진행");
      sectionsWithImages.push(section);
    }
  }

  const newContent = sectionsWithImages.join("\n\n");
  const firstImageMatch = newContent.match(
    /https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^\s"<>)]+\?alt=media&token=[a-f0-9-]+/,
  );
  const featuredImage = firstImageMatch?.[0] ?? "";

  await ref.update({
    content: newContent,
    featuredImage,
    updatedAt: Timestamp.now(),
  });
  console.log(`완료: ${imageIndex}개 이미지 생성, featuredImage=${featuredImage}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
