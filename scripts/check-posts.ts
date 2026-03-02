/**
 * 게시글 데이터 확인 스크립트
 * 실행: npx tsx scripts/check-posts.ts
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
  initializeApp({
    projectId: "hearamclinic-ef507",
  });
}

const db = getFirestore();

async function main() {
  const snapshot = await db.collection("posts").orderBy("date", "desc").get();
  console.log(`총 ${snapshot.size}개 포스트\n`);

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const date = data.date?.toDate?.()?.toISOString?.()?.slice(0, 10) ?? "no-date";
    console.log(`[${date}] author="${data.author}" title="${data.title}" slug="${data.slug}"`);
  }

  // 작성자별 통계
  const authorCounts: Record<string, number> = {};
  for (const doc of snapshot.docs) {
    const author = doc.data().author ?? "(없음)";
    authorCounts[author] = (authorCounts[author] || 0) + 1;
  }
  console.log("\n=== 작성자별 통계 ===");
  for (const [author, count] of Object.entries(authorCounts)) {
    console.log(`  ${author}: ${count}개`);
  }
}

main().catch((err) => {
  console.error("확인 실패:", err);
  process.exit(1);
});
