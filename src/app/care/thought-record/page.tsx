"use client";

import { useState } from "react";
import {
  buildUserContext,
  callThoughtRecord,
  savePracticeSession,
  type ThoughtRecordResult,
} from "@/lib/care";
import CareTabsNav from "@/components/care/CareTabsNav";

export default function ThoughtRecordPage() {
  const [situation, setSituation] = useState("");
  const [automaticThought, setAutomaticThought] = useState("");
  const [emotion, setEmotion] = useState("");
  const [result, setResult] = useState<ThoughtRecordResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!situation.trim() || !automaticThought.trim()) {
      setError("상황과 떠오른 생각을 적어주세요.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const ctx = await buildUserContext();
      const data = await callThoughtRecord({
        situation: situation.trim(),
        automaticThought: automaticThought.trim(),
        emotion: emotion.trim() || undefined,
        context: ctx,
      });
      setResult(data);
      savePracticeSession(
        "thought-record",
        { situation, automaticThought, emotion, context: ctx },
        data,
      );
    } catch (err) {
      console.error(err);
      setError("분석에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setSituation("");
    setAutomaticThought("");
    setEmotion("");
    setResult(null);
    setError("");
  }

  return (
    <div className="max-w-2xl mx-auto">
      <CareTabsNav />
      <h1 className="text-3xl font-bold text-purple-900 mb-2">📝 CBT 사고 기록</h1>
      <p className="text-gray-600 mb-6">
        마음에 떠오른 자동 사고를 입력하시면 인지 왜곡을 살피고 균형 잡힌 생각을 함께 정리해 드립니다.
      </p>

      {!result && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              어떤 상황이었나요?
            </label>
            <textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="예: 회의에서 발표 후 동료가 다른 곳을 봤다"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              그 순간 떠오른 생각은요?
            </label>
            <textarea
              value={automaticThought}
              onChange={(e) => setAutomaticThought(e.target.value)}
              placeholder="예: 내 발표가 지루했나 보다. 사람들이 나를 무능하다고 생각할 거야."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              어떤 감정이 들었나요? (선택)
            </label>
            <input
              type="text"
              value={emotion}
              onChange={(e) => setEmotion(e.target.value)}
              placeholder="예: 부끄러움 70, 무력감 50"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition"
          >
            {loading ? "함께 살펴보는 중..." : "분석하기"}
          </button>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
      )}

      {result && (
        <div className="space-y-5">
          <div className="bg-purple-50 border border-purple-100 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-purple-800 mb-2">먼저, 그 마음을</h3>
            <p className="text-purple-900 leading-relaxed">{result.validation}</p>
          </div>

          {result.distortions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <h3 className="text-sm font-bold text-purple-900 mb-3">살펴볼 인지 왜곡</h3>
              <ul className="space-y-3">
                {result.distortions.map((d, i) => (
                  <li key={i} className="border-l-2 border-purple-300 pl-3">
                    <p className="text-sm font-semibold text-purple-700">{d.name}</p>
                    <p className="text-sm text-gray-700 mt-1">{d.explain}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-purple-900 mb-3">증거를 점검하는 질문</h3>
            <ol className="space-y-2 list-decimal list-inside text-sm text-gray-700">
              {result.questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-emerald-800 mb-2">균형 잡힌 생각</h3>
            <p className="text-emerald-900 leading-relaxed">
              {result.balancedThought}
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <h3 className="text-sm font-bold text-amber-800 mb-2">지금 해볼 작은 행동</h3>
            <p className="text-amber-900 leading-relaxed">{result.smallAction}</p>
          </div>

          {result.gentleNote && (
            <p className="text-xs text-gray-500 italic">{result.gentleNote}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleReset}
              className="flex-1 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition"
            >
              새 사고 기록
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
