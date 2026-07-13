"use client";

import { auth } from "@/lib/firebase";
import { listUserTestResults } from "@/lib/test-history";

// 가이드 모드에서 시행할 순서
export const PERSONALITY_TEST_ORDER = [
  { type: "big5", path: "/personality/big5", title: "Big 5 성격 검사", emoji: "🧬" },
  { type: "enneagram", path: "/personality/enneagram", title: "에니어그램", emoji: "🌐" },
  { type: "attachment", path: "/personality/attachment", title: "애착 유형", emoji: "💞" },
  { type: "disc", path: "/personality/disc", title: "DISC 행동 유형", emoji: "🎯" },
  { type: "riasec", path: "/personality/riasec", title: "직업흥미 검사 (RIASEC)", emoji: "🧭" },
] as const;

export const TOTAL_TESTS = PERSONALITY_TEST_ORDER.length;

export interface GuideNext {
  path: string;
  title: string;
  emoji: string;
  index: number; // 1부터 시작 (이번에 시행할 검사가 몇 번째인지)
  total: number;
}

/**
 * 가이드 모드 안에서 "다음에 시행해야 할 검사" 찾기.
 * 모두 끝났으면 null 반환 → 보고서 페이지로.
 *
 * @param currentType 방금 끝낸 검사 type (없으면 첫 미완료부터)
 */
export async function getNextGuidedTest(
  currentType?: string,
): Promise<GuideNext | null> {
  const user = auth.currentUser;
  if (!user) {
    // 비로그인이면 첫 검사부터 안내 (저장 안 되지만 흐름은 유지)
    const first = PERSONALITY_TEST_ORDER[0];
    return {
      path: first.path,
      title: first.title,
      emoji: first.emoji,
      index: 1,
      total: TOTAL_TESTS,
    };
  }

  const results = await listUserTestResults(user.uid, { max: 100 });
  const completed = new Set(results.map((r) => r.type));

  // currentType 이후부터 검색 (없으면 처음부터)
  let startIndex = 0;
  if (currentType) {
    const idx = PERSONALITY_TEST_ORDER.findIndex((t) => t.type === currentType);
    if (idx >= 0) startIndex = idx + 1;
  }

  // 1차: currentType 다음 위치부터 미완료 검사 찾기
  for (let i = startIndex; i < PERSONALITY_TEST_ORDER.length; i++) {
    const t = PERSONALITY_TEST_ORDER[i];
    if (!completed.has(t.type)) {
      return { path: t.path, title: t.title, emoji: t.emoji, index: i + 1, total: TOTAL_TESTS };
    }
  }

  // 2차: 전체에서 미완료 검사 찾기 (currentType이 마지막 검사였을 때)
  for (let i = 0; i < startIndex; i++) {
    const t = PERSONALITY_TEST_ORDER[i];
    if (!completed.has(t.type)) {
      return { path: t.path, title: t.title, emoji: t.emoji, index: i + 1, total: TOTAL_TESTS };
    }
  }

  return null; // 전체 완료
}

/** 가이드 모드 진입 URL */
export function guidedPath(path: string): string {
  return `${path}?guided=1`;
}
