"use client";

import React, { useMemo, useState } from "react";
import QUESTIONS, {
  Big5Dimension,
  DIMENSION_LABELS,
  LIKERT_LABELS,
} from "@/lib/test/big5/questions";
import {
  DIMENSION_DESCRIPTIONS,
  Level,
  TYPES,
  buildCode,
  levelToHL,
} from "@/lib/test/big5/types";
import Big5RadarChart from "./Big5RadarChart";

type Status = "ready" | "test" | "result";

const QUESTIONS_PER_PAGE = 8;

function scoreOf(value: number, reverse: boolean): number {
  // 1~5 → 정채점 그대로, 역채점 반전
  return reverse ? 6 - value : value;
}

function levelOf(percent: number): Level {
  if (percent < 35) return "Low";
  if (percent > 65) return "High";
  return "Mid";
}

export default function Big5Test() {
  const [status, setStatus] = useState<Status>("ready");
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const totalPages = Math.ceil(QUESTIONS.length / QUESTIONS_PER_PAGE);
  const pageQuestions = QUESTIONS.slice(
    page * QUESTIONS_PER_PAGE,
    (page + 1) * QUESTIONS_PER_PAGE,
  );

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === QUESTIONS.length;
  const pageAllAnswered = pageQuestions.every((q) => answers[q.id] !== undefined);

  function handleStart() {
    setStatus("test");
    setPage(0);
    setAnswers({});
  }

  function handleAnswer(qid: number, value: number) {
    setAnswers((prev) => ({ ...prev, [qid]: value }));
  }

  function handleNext() {
    if (page < totalPages - 1) {
      setPage(page + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setStatus("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handlePrev() {
    if (page > 0) {
      setPage(page - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function reset() {
    setStatus("ready");
    setPage(0);
    setAnswers({});
  }

  // 결과 계산: 차원별 점수 0~1 정규화
  const result = useMemo(() => {
    if (!allAnswered) return null;
    const dims: Big5Dimension[] = ["O", "C", "E", "A", "N"];
    const rawByDim: Record<Big5Dimension, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    const countByDim: Record<Big5Dimension, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    for (const q of QUESTIONS) {
      const a = answers[q.id];
      if (a === undefined) continue;
      rawByDim[q.dimension] += scoreOf(a, q.reverse);
      countByDim[q.dimension] += 1;
    }
    // 각 차원 점수: (raw - min) / (max - min) where min = 1*N, max = 5*N
    const scores: Record<Big5Dimension, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    const percents: Record<Big5Dimension, number> = { O: 0, C: 0, E: 0, A: 0, N: 0 };
    const levels: Record<Big5Dimension, Level> = { O: "Mid", C: "Mid", E: "Mid", A: "Mid", N: "Mid" };
    for (const d of dims) {
      const min = countByDim[d];
      const max = countByDim[d] * 5;
      const norm = (rawByDim[d] - min) / (max - min);
      scores[d] = norm;
      percents[d] = Math.round(norm * 100);
      levels[d] = levelOf(percents[d]);
    }
    const codeLevels: Record<Big5Dimension, "H" | "L"> = {
      O: levelToHL(levels.O === "Mid" ? (percents.O >= 50 ? "High" : "Low") : levels.O),
      C: levelToHL(levels.C === "Mid" ? (percents.C >= 50 ? "High" : "Low") : levels.C),
      E: levelToHL(levels.E === "Mid" ? (percents.E >= 50 ? "High" : "Low") : levels.E),
      A: levelToHL(levels.A === "Mid" ? (percents.A >= 50 ? "High" : "Low") : levels.A),
      N: levelToHL(levels.N === "Mid" ? (percents.N >= 50 ? "High" : "Low") : levels.N),
    };
    const code = buildCode(codeLevels);
    const type = TYPES[code];
    return { scores, percents, levels, code, type };
  }, [allAnswered, answers]);

  return (
    <div className="mx-auto max-w-2xl">
      {status === "ready" && (
        <div>
          <h1 className="text-3xl font-bold text-purple-900 mb-6">
            Big 5 성격 검사
          </h1>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">검사 안내</h3>
            <p className="mb-3 font-medium text-gray-800">
              개방성, 성실성, 외향성, 친화성, 정서 민감성의 5가지 차원으로 본인의 성격 특성을 살펴봅니다.
            </p>
            <p className="text-sm mb-3 text-purple-700">
              총 40문항이며, 각 문항마다 본인에게 가장 가까운 정도를 5점 척도로 선택하시면 됩니다.
            </p>
            <p className="text-sm mb-3 text-gray-700">
              결과는 5차원의 레이더 차트와 32개 유형 중 하나의 성격 유형으로 보고됩니다. 각 차원과 유형의 의미를 함께 안내해 드립니다.
            </p>
            <p className="text-xs mb-4 text-gray-500">
              본 검사는 자가 점검을 위한 도구이며 진단 목적으로 사용되지 않습니다. 결과는 응답 시점의 컨디션에 따라 달라질 수 있습니다.
            </p>
            <div className="flex justify-center">
              <button
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
                onClick={handleStart}
              >
                검사 시작
              </button>
            </div>
          </div>
        </div>
      )}

      {status === "test" && (
        <div>
          <div className="mb-6 mt-4">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-purple-900 text-xl font-bold">
                Big 5 성격 검사
              </h1>
              <span className="text-sm text-gray-500">
                {answeredCount} / {QUESTIONS.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-600 h-full transition-all"
                style={{
                  width: `${(answeredCount / QUESTIONS.length) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="space-y-5">
            {pageQuestions.map((q) => (
              <div
                key={q.id}
                className="bg-white border border-gray-200 rounded-xl p-5"
              >
                <p className="text-base font-medium text-gray-800 mb-4">
                  {q.id}. {q.text}
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {LIKERT_LABELS.map((label, i) => {
                    const value = i + 1;
                    const selected = answers[q.id] === value;
                    return (
                      <button
                        key={value}
                        onClick={() => handleAnswer(q.id, value)}
                        className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg border transition text-xs ${
                          selected ?
                            "bg-purple-600 border-purple-600 text-white" :
                            "bg-white border-gray-300 text-gray-700 hover:border-purple-400"
                        }`}
                      >
                        <span className="text-base font-semibold">{value}</span>
                        <span className="text-[10px] leading-tight text-center">
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between mt-8">
            <button
              onClick={handlePrev}
              disabled={page === 0}
              className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition"
            >
              이전
            </button>
            <button
              onClick={handleNext}
              disabled={!pageAllAnswered}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 transition"
            >
              {page === totalPages - 1 ? "결과 보기" : "다음"}
            </button>
          </div>
        </div>
      )}

      {status === "result" && result && (
        <div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 mb-6">
            <p className="text-sm text-purple-700 font-medium mb-1">
              당신의 유형
            </p>
            <h1 className="text-3xl font-bold text-purple-900 mb-2">
              {result.type?.name ?? result.code}
            </h1>
            <p className="text-base text-gray-700 mb-4">
              {result.type?.tagline}
            </p>
            <p className="text-xs text-purple-600 font-mono">
              유형 코드: {result.code}
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-purple-900 mb-4 text-center">
              성격 차원 프로필
            </h2>
            <div className="flex justify-center mb-2">
              <Big5RadarChart scores={result.scores} />
            </div>
          </div>

          {result.type && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-purple-900 mb-3">
                유형 설명
              </h2>
              <p className="text-gray-700 leading-relaxed mb-5">
                {result.type.summary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-green-800 mb-2">
                    강점
                  </h3>
                  <ul className="space-y-1 text-sm text-green-900">
                    {result.type.strengths.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-amber-800 mb-2">
                    유의할 점
                  </h3>
                  <ul className="space-y-1 text-sm text-amber-900">
                    {result.type.challenges.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-purple-900 mb-4">
              차원별 자세히 보기
            </h2>
            <div className="space-y-5">
              {(Object.keys(DIMENSION_LABELS) as Big5Dimension[]).map((d) => {
                const label = DIMENSION_LABELS[d];
                const percent = result.percents[d];
                const level = result.levels[d];
                const text = DIMENSION_DESCRIPTIONS[d][level];
                return (
                  <div key={d} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-baseline mb-2">
                      <h3 className="text-base font-bold text-gray-900">
                        {label.ko}{" "}
                        <span className="text-xs font-normal text-gray-400">
                          ({label.en})
                        </span>
                      </h3>
                      <span className="text-sm font-bold text-purple-600">
                        {percent}점 ·{" "}
                        {level === "High" ?
                          "높음" :
                          level === "Low" ?
                            "낮음" :
                            "보통"}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden mb-2">
                      <div
                        className="bg-purple-500 h-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {text}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="flex-1 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition"
              onClick={reset}
            >
              다시 검사하기
            </button>
          </div>

          <p className="text-xs text-gray-500 mt-4 text-center">
            본 결과는 자가 점검 도구이며, 의학적 진단을 대체하지 않습니다.
          </p>
        </div>
      )}
    </div>
  );
}
