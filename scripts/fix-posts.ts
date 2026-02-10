/**
 * 블로그 글 일괄 수정 스크립트
 * - author: "이정석" → "해람원장"
 * - 본문에서 "해람 연구회 최신 글 보기" 포함 아래 내용 삭제
 *
 * 실행: npx tsx scripts/fix-posts.ts
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
  console.log("=== 블로그 글 일괄 수정 시작 ===\n");

  const snapshot = await db.collection("posts").get();
  console.log(`총 ${snapshot.size}개 포스트 발견\n`);

  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates: Record<string, string> = {};

    // 1. author 변경
    if (data.author === "이정석") {
      updates.author = "해람원장";
    }

    // 2. "해람 연구회 최신 글 보기" 포함 아래 내용 삭제
    const content: string = data.content ?? "";
    const cutIndex = content.indexOf("해람 연구회 최신 글 보기");
    if (cutIndex !== -1) {
      // 해당 줄의 시작 위치 찾기
      const lineStart = content.lastIndexOf("\n", cutIndex - 1);
      const trimmed = content.slice(0, lineStart === -1 ? cutIndex : lineStart).trimEnd();
      updates.content = trimmed;
    }

    if (Object.keys(updates).length > 0) {
      await doc.ref.update(updates);
      console.log(`  ✓ 수정: ${data.title}`);
      if (updates.author) console.log(`    - author: 이정석 → 해람원장`);
      if (updates.content) console.log(`    - 본문 하단 "해람 연구회 최신 글 보기" 이후 삭제`);
      updatedCount++;
    }
  }

  console.log(`\n=== 완료! ${updatedCount}/${snapshot.size}개 포스트 수정됨 ===`);
}

main().catch((err) => {
  console.error("수정 실패:", err);
  process.exit(1);
});
