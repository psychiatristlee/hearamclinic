"use client";

import { useState } from "react";
import {
  buildUserContext,
  callMindfulnessScript,
  savePracticeSession,
  type MindfulnessResult,
} from "@/lib/care";
import CareTabsNav from "@/components/care/CareTabsNav";

const FOCUS_OPTIONS = [
  "지금 이 순간으로 돌아오기",
  "긴장 풀기와 신체 이완",
  "생각을 흘려보내기",
  "감정 알아차림과 수용",
  "잠들기 전 마음 정리",
];

export default function MindfulnessPage() {
  const [minutes, setMinutes] = useState(5);
  const [focus, setFocus] = useState(FOCUS_OPTIONS[0]);
  const [result, setResult] = useState<MindfulnessResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const ctx = await buildUserContext();
      const data = await callMindfulnessScript({
        minutes,
        focus,
        context: ctx,
      });
      setResult(data);
      savePracticeSession(
        "mindfulness",
        { minutes, focus, context: ctx },
        data,
      );
    } catch (err) {
      console.error(err);
      setError("스크립트 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <CareTabsNav />
      <h1 className="text-3xl font-bold text-purple-900 mb-2">🧘 마음챙김 명상</h1>
      <p className="text-gray-600 mb-6">
        원하는 시간과 초점을 알려주시면 따라 읽을 수 있는 명상 스크립트를 만들어 드립니다.
      </p>

      {!result && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              시간
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[2, 3, 5, 8, 12].map((m) => (
                <button
                  key={m}
                  onClick={() => setMinutes(m)}
                  className={`py-2 rounded-lg border text-sm font-semibold transition ${
                    minutes === m
                      ? "bg-purple-600 border-purple-600 text-white"
                      : "bg-white border-gray-300 text-gray-700 hover:border-purple-400"
                  }`}
                >
                  {m}분
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              초점
            </label>
            <div className="space-y-2">
              {FOCUS_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFocus(f)}
                  className={`w-full px-4 py-2 rounded-lg border text-sm text-left transition ${
                    focus === f
                      ? "bg-purple-600 border-purple-600 text-white"
                      : "bg-white border-gray-300 text-gray-700 hover:border-purple-400"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition"
          >
            {loading ? "만드는 중..." : "스크립트 만들기"}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      )}

      {result && (
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6">
            <p className="text-xs text-purple-600 font-medium mb-1">
              {result.duration}분 · {result.focus}
            </p>
            <h2 className="text-2xl font-bold text-purple-900">{result.title}</h2>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
            {result.segments.map((seg, i) => (
              <div
                key={i}
                className="border-l-2 border-purple-200 pl-4 first:pt-0 last:pb-0"
              >
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="text-sm font-bold text-purple-800">{seg.phase}</h3>
                  <span className="text-xs text-gray-400">약 {seg.approxSeconds}초</span>
                </div>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {seg.text}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setResult(null)}
            className="w-full px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition"
          >
            새 스크립트 만들기
          </button>
        </div>
      )}
    </div>
  );
}
