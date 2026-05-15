"use client";

import { useState } from "react";
import {
  buildUserContext,
  callBreathingGuide,
  savePracticeSession,
  type BreathingResult,
} from "@/lib/care";
import CareTabsNav from "@/components/care/CareTabsNav";

export default function BreathingPage() {
  const [result, setResult] = useState<BreathingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const ctx = await buildUserContext();
      const data = await callBreathingGuide(ctx);
      setResult(data);
      savePracticeSession("breathing", { context: ctx }, data);
    } catch (err) {
      console.error(err);
      setError("가이드 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <CareTabsNav />
      <h1 className="text-3xl font-bold text-purple-900 mb-2">🌬 호흡 가이드</h1>
      <p className="text-gray-600 mb-6">
        지금 본인의 컨디션에 맞춰 1-3분 호흡 가이드를 만들어 드립니다.
      </p>

      {!result && (
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6 text-center">
          <p className="text-sm text-purple-800 mb-5">
            잠시 머무르며, 호흡으로 지금 이 순간으로 돌아와 보세요.
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition"
          >
            {loading ? "만드는 중..." : "지금 시작하기"}
          </button>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>
      )}

      {result && (
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6">
            <p className="text-xs text-purple-600 font-medium mb-1">
              {result.technique} · 약 {Math.round(result.totalSeconds / 60 * 10) / 10}분
            </p>
            <h2 className="text-2xl font-bold text-purple-900 mb-3">{result.title}</h2>
            <p className="text-gray-700 leading-relaxed">{result.intro}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-purple-900 mb-4">함께 따라하기</h3>
            <ol className="space-y-3">
              {result.steps.map((step, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-semibold text-purple-800">
                        {step.label}
                      </span>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {step.seconds}초
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">{step.instruction}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-emerald-800 mb-2">호흡 후</h3>
            <p className="text-sm text-emerald-900 leading-relaxed">
              {result.afterCare}
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition"
          >
            {loading ? "만드는 중..." : "새 가이드 만들기"}
          </button>
        </div>
      )}
    </div>
  );
}
