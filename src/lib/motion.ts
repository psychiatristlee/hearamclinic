"use client";

/**
 * 모션 관련 공용 헬퍼.
 * 사용자가 OS에서 "동작 줄이기"를 켰으면 부드러운 스크롤 대신 즉시 이동한다.
 * (CSS scroll-behavior는 JS의 behavior: "smooth"를 덮지 못하므로 여기서 분기)
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? "auto" : "smooth";
}

/** 페이지 맨 위로 (검사 페이지 넘김 등) */
export function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: scrollBehavior() });
}
