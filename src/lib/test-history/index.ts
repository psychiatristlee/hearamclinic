"use client";

import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  Timestamp,
  type DocumentData,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export type TestCategory = "personality" | "attention" | "questionnaire" | "tracking";

export interface TestResultPayload {
  type: string; // e.g. "big5", "stroop", "phq9"
  category: TestCategory;
  displayTitle: string;
  summary: string; // 짧은 한 줄 요약 (대시보드 표시용)
  result: Record<string, unknown>;
}

export interface TestResultRecord extends TestResultPayload {
  id: string;
  completedAt: Date;
}

/**
 * 현재 로그인된 사용자에게 검사 결과를 저장.
 * 비로그인 상태면 아무 일도 하지 않음. (저장 못 함을 silent하게)
 */
export async function saveTestResult(
  payload: TestResultPayload,
): Promise<{ saved: boolean; id?: string }> {
  const user = auth.currentUser;
  if (!user) return { saved: false };

  try {
    const ref = await addDoc(
      collection(db, "users", user.uid, "testResults"),
      {
        ...payload,
        completedAt: Timestamp.now(),
      },
    );
    return { saved: true, id: ref.id };
  } catch (err) {
    console.error("[saveTestResult] 실패:", err);
    return { saved: false };
  }
}

/**
 * 사용자의 검사 결과 히스토리 조회.
 */
export async function listUserTestResults(
  uid: string,
  options?: { type?: string; max?: number },
): Promise<TestResultRecord[]> {
  const max = options?.max ?? 100;
  const ref = collection(db, "users", uid, "testResults");
  const q = options?.type ?
    query(ref, where("type", "==", options.type), orderBy("completedAt", "desc"), limit(max)) :
    query(ref, orderBy("completedAt", "desc"), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const data = d.data() as DocumentData;
    return {
      id: d.id,
      type: data.type as string,
      category: data.category as TestCategory,
      displayTitle: data.displayTitle as string,
      summary: data.summary as string,
      result: (data.result as Record<string, unknown>) ?? {},
      completedAt: (data.completedAt as Timestamp).toDate(),
    };
  });
}
