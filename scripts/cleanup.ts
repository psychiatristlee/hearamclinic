/**
 * Firestore posts + Storage 이미지 전체 삭제
 * 실행: npx tsx scripts/cleanup.ts
 */
import { initializeApp, cert, type ServiceAccount } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import * as fs from "fs";
import * as path from "path";

const serviceAccountPath = path.join(__dirname, "../service-account-key.json");

if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = JSON.parse(
    fs.readFileSync(serviceAccountPath, "utf-8")
  ) as ServiceAccount;
  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: "hearamclinic-ef507.firebasestorage.app",
  });
} else {
  initializeApp({
    projectId: "hearamclinic-ef507",
    storageBucket: "hearamclinic-ef507.firebasestorage.app",
  });
}

const db = getFirestore();
const bucket = getStorage().bucket();

async function main() {
  // 1. Firestore posts 삭제
  console.log("Firestore posts 삭제 중...");
  const snapshot = await db.collection("posts").get();
  if (snapshot.empty) {
    console.log("삭제할 포스트 없음");
  } else {
    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    console.log(`${snapshot.size}개 포스트 삭제 완료`);
  }

  // 2. Storage 이미지 삭제
  console.log("\nStorage blog-images 삭제 중...");
  try {
    const [files] = await bucket.getFiles({ prefix: "blog-images/" });
    if (files.length === 0) {
      console.log("삭제할 이미지 없음");
    } else {
      for (const file of files) {
        await file.delete();
      }
      console.log(`${files.length}개 이미지 삭제 완료`);
    }
  } catch {
    console.log("Storage 삭제 건너뜀");
  }

  console.log("\n전체 삭제 완료!");
}

main().catch((err) => {
  console.error("삭제 실패:", err);
  process.exit(1);
});
