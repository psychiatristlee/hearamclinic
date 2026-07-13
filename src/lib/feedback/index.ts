"use client";

import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";

export type FeedbackCategory = "improvement" | "bug" | "content" | "other";

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  improvement: "기능 개선 제안",
  bug: "오류 신고",
  content: "콘텐츠 관련",
  other: "기타 의견",
};

export interface FeedbackInput {
  message: string;
  category: FeedbackCategory;
  email?: string;
}

/**
 * 개선사항/피드백 제출. 비로그인도 가능.
 * 로그인 상태면 uid를 함께 기록해 후속 응대에 활용.
 */
export async function submitFeedback(
  input: FeedbackInput,
): Promise<{ ok: boolean }> {
  const message = input.message.trim().slice(0, 2000);
  if (!message) return { ok: false };

  try {
    await addDoc(collection(db, "feedback"), {
      message,
      category: input.category,
      email: input.email?.trim().slice(0, 200) || "",
      path: typeof window !== "undefined" ? window.location.pathname : "",
      uid: auth.currentUser?.uid ?? "",
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 300) : "",
      createdAt: serverTimestamp(),
      status: "new",
    });
    return { ok: true };
  } catch (err) {
    console.error("[submitFeedback] 실패:", err);
    return { ok: false };
  }
}
