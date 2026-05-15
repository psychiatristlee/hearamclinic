"use client";

import { useState } from "react";
import {
  buildUserContext,
  callGratitudePrompts,
  savePracticeSession,
  type GratitudeResult,
} from "@/lib/care";

export default function GratitudePage() {
  const [result, setResult] = useState<GratitudeResult | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setAnswers({});
    try {
      const ctx = await buildUserContext();
      const data = await callGratitudePrompts(ctx);
      setResult(data);
      savePracticeSession("gratitude", { context: ctx }, data);
    } catch (err) {
      console.error(err);
      setError("프롬프트 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-purple-900 mb-2">🌿 감사 일기</h1>
      <p className="text-gray-600 mb-6">
        오늘에 어울리는 감사 프롬프트 3개를 매번 새로 만들어 드립니다.
      </p>

      {!result && (
        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-6 text-center">
          <p className="text-sm text-purple-800 mb-5">
            오늘의 작은 결을 한 번 돌아봐 주세요.
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="px-8 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition"
          >
            {loading ? "만드는 중..." : "오늘의 프롬프트 만들기"}
          </button>
          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}
        </div>
      )}

      {result && (
        <div className="space-y-5">
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5">
            <p className="text-purple-900 leading-relaxed">{result.intro}</p>
          </div>

          {result.prompts.map((p, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-2xl p-5">
              <p className="text-sm font-semibold text-purple-700 mb-1">{i + 1}.</p>
              <p className="text-base font-medium text-gray-900 mb-1">{p.question}</p>
              <p className="text-xs text-gray-500 mb-3">{p.hint}</p>
              <textarea
                value={answers[i] ?? ""}
                onChange={(e) =>
                  setAnswers({ ...answers, [i]: e.target.value })
                }
                rows={3}
                placeholder="떠오르는 것을 자유롭게 적어보세요"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
          ))}

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
            <p className="text-emerald-900 leading-relaxed italic">
              {result.closing}
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition"
          >
            {loading ? "만드는 중..." : "새 프롬프트 만들기"}
          </button>

          <p className="text-xs text-gray-500 text-center">
            적으신 내용은 디바이스에만 머무릅니다 (자동 저장 안 됨)
          </p>
        </div>
      )}
    </div>
  );
}
