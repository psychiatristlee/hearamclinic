"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
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
  characterImageUrl,
  levelToHL,
} from "@/lib/test/big5/types";
import Big5RadarChart from "./Big5RadarChart";
import { saveTestResult } from "@/lib/test-history";
import ResultInsights from "./ResultInsights";
import SaveLoginPrompt from "@/components/auth/SaveLoginPrompt";
import GuidedNextButton from "./GuidedNextButton";

const VALID_CODE_RE = /^[HL]{5}$/;

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
  const searchParams = useSearchParams();
  const router = useRouter();
  const sharedCodeFromUrl = searchParams?.get("result") ?? null;
  const initialStatus: Status =
    sharedCodeFromUrl && VALID_CODE_RE.test(sharedCodeFromUrl) ? "result" : "ready";

  const [status, setStatus] = useState<Status>(initialStatus);
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [shareToast, setShareToast] = useState("");

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

  // URL로 들어온 공유 코드만 있는 경우의 결과 (점수 정보는 없음)
  const sharedResult = useMemo(() => {
    if (
      status !== "result" ||
      !sharedCodeFromUrl ||
      !VALID_CODE_RE.test(sharedCodeFromUrl) ||
      Object.keys(answers).length > 0
    ) return null;
    const code = sharedCodeFromUrl;
    const type = TYPES[code];
    if (!type) return null;
    // 코드에서 H/L → 가짜 점수 (시각화용 75/25)
    const scoreFor = (ch: string) => (ch === "H" ? 0.75 : 0.25);
    const scores = {
      O: scoreFor(code[0]),
      C: scoreFor(code[1]),
      E: scoreFor(code[2]),
      A: scoreFor(code[3]),
      N: scoreFor(code[4]),
    };
    const levelFor = (ch: string): Level => (ch === "H" ? "High" : "Low");
    const levels = {
      O: levelFor(code[0]),
      C: levelFor(code[1]),
      E: levelFor(code[2]),
      A: levelFor(code[3]),
      N: levelFor(code[4]),
    };
    const percents = {
      O: Math.round(scores.O * 100),
      C: Math.round(scores.C * 100),
      E: Math.round(scores.E * 100),
      A: Math.round(scores.A * 100),
      N: Math.round(scores.N * 100),
    };
    return { scores, percents, levels, code, type, isShared: true };
  }, [status, sharedCodeFromUrl, answers]);

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
    return { scores, percents, levels, code, type, isShared: false };
  }, [allAnswered, answers]);

  // 결과가 산출되면 URL에 코드를 동기화 + Firestore 저장
  useEffect(() => {
    if (result && status === "result" && !sharedCodeFromUrl) {
      router.replace(`/personality/big5?result=${result.code}`, { scroll: false });
      const typeName = result.type?.name ?? result.code;
      saveTestResult({
        type: "big5",
        category: "personality",
        displayTitle: "Big 5 성격 검사",
        summary: `${typeName} (${result.code})`,
        result: {
          code: result.code,
          percents: result.percents,
          typeName,
        },
      });
    }
  }, [result, status, sharedCodeFromUrl, router]);

  const displayResult = result || sharedResult;

  async function handleShare() {
    if (!displayResult) return;
    const url = `${window.location.origin}/personality/big5?result=${displayResult.code}`;
    const shareText = `Big 5 성격 검사 결과: ${displayResult.type?.name ?? displayResult.code}\n${displayResult.type?.tagline ?? ""}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayResult.type?.name ?? "Big 5"} - Big 5 성격 검사`,
          text: shareText,
          url,
        });
        return;
      } catch {
        // 사용자가 공유 취소하면 클립보드 폴백 안 함
        return;
      }
    }

    // Web Share API 없으면 클립보드 복사
    try {
      await navigator.clipboard.writeText(url);
      setShareToast("링크가 복사되었습니다");
      setTimeout(() => setShareToast(""), 2500);
    } catch {
      setShareToast("복사에 실패했습니다. URL을 직접 복사해 주세요.");
      setTimeout(() => setShareToast(""), 2500);
    }
  }

  function handleStartFromShared() {
    router.replace("/personality/big5", { scroll: false });
    setStatus("ready");
  }

  return (
    <div className="mx-auto max-w-2xl">
      {status === "ready" && (
        <div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="relative aspect-[16/9] bg-purple-50">
              <Image
                src="https://firebasestorage.googleapis.com/v0/b/hearamclinic-ef507.firebasestorage.app/o/personality%2Fbig5%2Fcover.png?alt=media"
                alt="Big 5 성격 검사"
                fill
                sizes="(max-width: 768px) 100vw, 672px"
                className="object-cover"
                priority
                unoptimized
              />
            </div>
            <div className="p-6 sm:p-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-purple-900 mb-2">
                Big 5 성격 검사
              </h1>
              <p className="text-gray-600 mb-6">
                5가지 차원으로 들여다보는 본인의 성격 프로필
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                  <p className="text-xs text-purple-600 font-medium mb-1">문항 수</p>
                  <p className="text-lg font-bold text-purple-900">40문항</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                  <p className="text-xs text-purple-600 font-medium mb-1">소요 시간</p>
                  <p className="text-lg font-bold text-purple-900">약 6분</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                  <p className="text-xs text-purple-600 font-medium mb-1">유형</p>
                  <p className="text-lg font-bold text-purple-900">32가지</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                    1
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">5점 척도로 답해주세요</p>
                    <p className="text-xs text-gray-500">전혀 그렇지 않다부터 매우 그렇다까지</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                    2
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">5가지 차원의 레이더 차트</p>
                    <p className="text-xs text-gray-500">개방성, 성실성, 외향성, 친화성, 정서 민감성</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                    3
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">32개 유형 중 본인 유형 안내</p>
                    <p className="text-xs text-gray-500">캐릭터 이미지, 강점, 차원별 해석까지</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-6">
                <p className="text-xs text-amber-900 leading-relaxed">
                  본 검사는 자가 점검을 위한 도구이며 진단 목적으로 사용되지 않습니다. 결과는 응답 시점의 컨디션에 따라 달라질 수 있습니다.
                </p>
              </div>

              <button
                className="w-full px-8 py-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-lg rounded-xl transition shadow-md hover:shadow-lg"
                onClick={handleStart}
              >
                검사 시작하기
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

      {status === "result" && displayResult && (
        <div>
          {!displayResult.isShared && <GuidedNextButton currentType="big5" />}
          {!displayResult.isShared && <SaveLoginPrompt />}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
              <div className="flex-shrink-0">
                <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg">
                  <Image
                    src={characterImageUrl(displayResult.code)}
                    alt={displayResult.type?.name ?? displayResult.code}
                    fill
                    sizes="144px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm text-purple-700 font-medium mb-1">
                  {displayResult.isShared ? "이 사람의 유형" : "당신의 유형"}
                </p>
                <h1 className="text-2xl sm:text-3xl font-bold text-purple-900 mb-2">
                  {displayResult.type?.name ?? displayResult.code}
                </h1>
                <p className="text-base text-gray-700 mb-3">
                  {displayResult.type?.tagline}
                </p>
                <p className="text-xs text-purple-600 font-mono">
                  유형 코드: {displayResult.code}
                </p>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={handleShare}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a3 3 0 10-5.464-2.684m5.464 2.684a3 3 0 11-5.464-2.684m0 0L8.684 10.658m6.632 5.000l-6.632-3.158" />
                </svg>
                공유하기
              </button>
            </div>
            {shareToast && (
              <p className="mt-3 text-sm text-center text-purple-700">
                {shareToast}
              </p>
            )}
          </div>

          {displayResult.isShared && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-sm text-blue-900">
              공유받은 결과를 보고 계십니다. 본인의 결과를 확인하고 싶으시면{" "}
              <button
                onClick={handleStartFromShared}
                className="underline font-medium hover:text-blue-700"
              >
                직접 검사를 진행
              </button>
              해 보세요.
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-purple-900 mb-4 text-center">
              성격 차원 프로필
            </h2>
            <div className="flex justify-center mb-2">
              <Big5RadarChart scores={displayResult.scores} />
            </div>
            {displayResult.isShared && (
              <p className="text-xs text-center text-gray-500 mt-2">
                공유 결과는 H/L 패턴만 전달되어 점수가 개략 값으로 표시됩니다.
              </p>
            )}
          </div>

          {displayResult.type && (
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-purple-900 mb-3">
                유형 설명
              </h2>
              <p className="text-gray-700 leading-relaxed mb-5">
                {displayResult.type.summary}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-green-800 mb-2">
                    강점
                  </h3>
                  <ul className="space-y-1 text-sm text-green-900">
                    {displayResult.type.strengths.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-amber-800 mb-2">
                    유의할 점
                  </h3>
                  <ul className="space-y-1 text-sm text-amber-900">
                    {displayResult.type.challenges.map((c, i) => (
                      <li key={i}>• {c}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {!displayResult.isShared && (
            <ResultInsights
              testType="big5"
              currentResult={{ percents: displayResult.percents }}
              metrics={[
                { metricKey: "dim_O", label: "개방성 (O)", color: "rgb(147 51 234)", extract: (r) => (r.percents as Record<string, number>)?.O, unit: "점", yMin: 0, yMax: 100 },
                { metricKey: "dim_C", label: "성실성 (C)", color: "rgb(59 130 246)", extract: (r) => (r.percents as Record<string, number>)?.C, unit: "점", yMin: 0, yMax: 100 },
                { metricKey: "dim_E", label: "외향성 (E)", color: "rgb(16 185 129)", extract: (r) => (r.percents as Record<string, number>)?.E, unit: "점", yMin: 0, yMax: 100 },
                { metricKey: "dim_A", label: "친화성 (A)", color: "rgb(245 158 11)", extract: (r) => (r.percents as Record<string, number>)?.A, unit: "점", yMin: 0, yMax: 100 },
                { metricKey: "dim_N", label: "정서 민감성 (N)", color: "rgb(244 63 94)", extract: (r) => (r.percents as Record<string, number>)?.N, unit: "점", yMin: 0, yMax: 100 },
              ]}
            />
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-purple-900 mb-4">
              차원별 자세히 보기
            </h2>
            <div className="space-y-5">
              {(Object.keys(DIMENSION_LABELS) as Big5Dimension[]).map((d) => {
                const label = DIMENSION_LABELS[d];
                const percent = displayResult.percents[d];
                const level = displayResult.levels[d];
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
              onClick={displayResult.isShared ? handleStartFromShared : reset}
            >
              {displayResult.isShared ? "내 검사 시작하기" : "다시 검사하기"}
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
