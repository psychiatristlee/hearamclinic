"use client";

import { doc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

const SESSION_KEY_PREFIX = "viewed-post-";

/**
 * 블로그 글 조회수 +1. 같은 세션에서는 한 번만 증가.
 * 비로그인도 가능 (firestore.rules에서 viewCount-only 증가는 누구나 허용).
 */
export async function incrementBlogViewIfNew(slug: string): Promise<void> {
  if (typeof window === "undefined") return;

  const key = SESSION_KEY_PREFIX + slug;
  try {
    if (sessionStorage.getItem(key)) return; // 같은 세션 중복 방지
    sessionStorage.setItem(key, "1");
  } catch {
    // sessionStorage 사용 불가 시에도 한 번은 증가 시도
  }

  try {
    await updateDoc(doc(db, "posts", slug), {
      viewCount: increment(1),
    });
  } catch (err) {
    // 권한 오류 또는 문서 부재 등은 silent 처리
    console.debug("[incrementBlogView] 실패", err);
  }
}

/** 조회수 표시 포맷 — 1000 단위 콤마, 만 이상은 "1.2만" */
export function formatViewCount(n: number | undefined | null): string {
  if (!n || n < 0) return "0";
  if (n < 10000) return n.toLocaleString("ko-KR");
  const man = n / 10000;
  return `${man.toFixed(man < 10 ? 1 : 0)}만`;
}
