"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getNextGuidedTest,
  guidedPath,
  TOTAL_TESTS,
  PERSONALITY_TEST_ORDER,
} from "@/lib/test/personality-guide";

interface Props {
  currentType: "big5" | "enneagram" | "attachment" | "disc";
}

/**
 * URL ?guided=1 일 때만 표시.
 * 다음 미완료 검사로 이동 또는 모든 검사 완료 시 보고서로 이동.
 */
export default function GuidedNextButton({ currentType }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);

  const isGuided = searchParams?.get("guided") === "1";
  if (!isGuided) return null;

  const currentIndex = PERSONALITY_TEST_ORDER.findIndex(
    (t) => t.type === currentType,
  );

  async function handleNext() {
    setLoading(true);
    const next = await getNextGuidedTest(currentType);
    if (next) {
      router.push(guidedPath(next.path));
    } else {
      router.push("/personality/report?ready=1");
    }
  }

  return (
    <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold">
          📊 종합 보고서 진행 중 · {currentIndex + 1} / {TOTAL_TESTS}
        </p>
      </div>
      <div className="flex gap-1.5 mb-4">
        {Array.from({ length: TOTAL_TESTS }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 rounded-full ${
              i <= currentIndex ? "bg-white" : "bg-white/30"
            }`}
          />
        ))}
      </div>
      <button
        onClick={handleNext}
        disabled={loading}
        className="w-full px-4 py-3 bg-white text-purple-700 font-bold rounded-lg hover:bg-purple-50 disabled:opacity-50 transition"
      >
        {loading
          ? "다음 검사로 이동 중..."
          : currentIndex < TOTAL_TESTS - 1
            ? "다음 검사로 →"
            : "📝 종합 보고서 보기"}
      </button>
    </div>
  );
}
