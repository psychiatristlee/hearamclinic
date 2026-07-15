"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

/**
 * 비로그인 수검자의 결과를 익명으로 규준(표준화) 통계에 기여.
 * 개인 식별 정보 없이 점수만 기록하며, Cloud Function 트리거가
 * testStats/{type} 집계(count/sum/sumSq)에 반영한다.
 * 로그인 사용자는 saveTestResult 경로가 이미 집계하므로 중복 방지를 위해 건너뜀.
 */
export async function contributeAnonStats(
  type: string,
  result: Record<string, unknown>,
): Promise<void> {
  if (auth.currentUser) return; // 로그인 시 기존 경로가 집계
  try {
    await addDoc(collection(db, "anonTestResults"), {
      type,
      result,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    // 통계 기여 실패는 사용자 경험에 영향 주지 않음
    console.warn("[anon-stats]", err);
  }
}
