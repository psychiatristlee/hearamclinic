/**
 * 모든 포스트의 featuredImage를 콘텐츠 내 첫 번째 이미지로 설정
 *
 * 실행: npx tsx scripts/fix-thumbnails.ts
 */

import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import * as fs from "fs";
import * as path from "path";

const serviceAccountPath = path.join(__dirname, "../service-account-key.json");

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf-8")
  ) as ServiceAccount;
  initializeApp({
    credential: cert(serviceAccount),
  });
} else {
  initializeApp({ projectId: "hearamclinic-ef507" });
}

const db = getFirestore();

async function main() {
  const snapshot = await db.collection("posts").get();
  console.log(`총 ${snapshot.size}개 포스트 확인 중...\n`);

  let fixed = 0;
  let alreadyOk = 0;
  let noImage = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const content: string = data.content || "";
    const title: string = data.title || doc.id;

    // 마크다운에서 첫 번째 이미지 URL 추출: ![...](url)
    const match = content.match(/!\[[^\]]*\]\(([^)]+)\)/);
    const firstImage = match?.[1] || "";

    if (!firstImage) {
      console.log(`[없음] ${title} — 콘텐츠에 이미지 없음`);
      noImage++;
      continue;
    }

    if (data.featuredImage === firstImage) {
      alreadyOk++;
      continue;
    }

    await doc.ref.update({ featuredImage: firstImage });
    console.log(`[수정] ${title}`);
    console.log(`  이전: ${data.featuredImage || "(비어있음)"}`);
    console.log(`  변경: ${firstImage}\n`);
    fixed++;
  }

  console.log(`\n=== 완료 ===`);
  console.log(`수정: ${fixed}개 | 정상: ${alreadyOk}개 | 이미지없음: ${noImage}개`);
}

main().catch((err) => {
  console.error("실패:", err);
  process.exit(1);
});
