"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import QUESTIONS, {
  EnneaType,
  LIKERT_LABELS,
  WINGS,
} from "@/lib/test/enneagram/questions";
import { TYPES, characterImageUrl } from "@/lib/test/enneagram/types";
import EnneagramRadarChart from "./EnneagramRadarChart";

type Status = "ready" | "test" | "result";

const QUESTIONS_PER_PAGE = 8;
const VALID_TYPE_RE = /^[1-9]$/;

export default function EnneagramTest() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sharedTypeStr = searchParams?.get("result") ?? null;
  const initialStatus: Status =
    sharedTypeStr && VALID_TYPE_RE.test(sharedTypeStr) ? "result" : "ready";

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

  // 답변 기반 결과
  const result = useMemo(() => {
    if (!allAnswered) return null;
    const sums: Record<EnneaType, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
    };
    const counts: Record<EnneaType, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
    };
    for (const q of QUESTIONS) {
      const a = answers[q.id];
      if (a === undefined) continue;
      sums[q.type] += a;
      counts[q.type] += 1;
    }
    const scores: Record<EnneaType, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
    };
    const percents: Record<EnneaType, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0,
    };
    for (const k of Object.keys(sums) as unknown as EnneaType[]) {
      const min = counts[k];
      const max = counts[k] * 5;
      const norm = (sums[k] - min) / (max - min);
      scores[k] = norm;
      percents[k] = Math.round(norm * 100);
    }
    // 주 유형 = 최고점, 동점이면 번호 작은 쪽
    const dominant = (Object.keys(scores) as unknown as EnneaType[]).reduce(
      (best, t) => (scores[t] > scores[best] ? t : best),
      1 as EnneaType,
    );
    // 부 유형 = 날개 중 점수 높은 쪽
    const [wL, wR] = WINGS[dominant];
    const wing: EnneaType = scores[wL] >= scores[wR] ? wL : wR;

    return { scores, percents, dominant, wing, isShared: false };
  }, [allAnswered, answers]);

  // 공유 코드 결과
  const sharedResult = useMemo(() => {
    if (
      status !== "result" ||
      !sharedTypeStr ||
      !VALID_TYPE_RE.test(sharedTypeStr) ||
      Object.keys(answers).length > 0
    ) return null;
    const dominant = parseInt(sharedTypeStr, 10) as EnneaType;
    const scores: Record<EnneaType, number> = {
      1: 0.3, 2: 0.3, 3: 0.3, 4: 0.3, 5: 0.3, 6: 0.3, 7: 0.3, 8: 0.3, 9: 0.3,
    };
    scores[dominant] = 0.85;
    // 양쪽 날개도 약간 높임
    const [wL, wR] = WINGS[dominant];
    scores[wL] = 0.55;
    scores[wR] = 0.55;
    const percents: Record<EnneaType, number> = { ...scores } as Record<EnneaType, number>;
    (Object.keys(percents) as unknown as EnneaType[]).forEach(
      (k) => (percents[k] = Math.round(scores[k] * 100)),
    );
    const wing: EnneaType = wL;
    return { scores, percents, dominant, wing, isShared: true };
  }, [status, sharedTypeStr, answers]);

  // URL 동기화
  useEffect(() => {
    if (result && status === "result" && !sharedTypeStr) {
      router.replace(`/personality/enneagram?result=${result.dominant}`, {
        scroll: false,
      });
    }
  }, [result, status, sharedTypeStr, router]);

  const displayResult = result || sharedResult;

  async function handleShare() {
    if (!displayResult) return;
    const url = `${window.location.origin}/personality/enneagram?result=${displayResult.dominant}`;
    const t = TYPES[displayResult.dominant];
    const shareText = `에니어그램 결과: ${displayResult.dominant}번 ${t.name}\n${t.tagline}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${displayResult.dominant}번 ${t.name} - 에니어그램`,
          text: shareText,
          url,
        });
        return;
      } catch {
        return;
      }
    }
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
    router.replace("/personality/enneagram", { scroll: false });
    setStatus("ready");
  }

  return (
    <div className="mx-auto max-w-2xl">
      {status === "ready" && (
        <div>
          <h1 className="text-3xl font-bold text-purple-900 mb-6">
            에니어그램 성격 검사
          </h1>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">검사 안내</h3>
            <p className="mb-3 font-medium text-gray-800">
              에니어그램은 9가지 성격 유형으로 사람의 마음 속 깊은 동기와 두려움을 살펴보는 성격 분석 도구입니다.
            </p>
            <p className="text-sm mb-3 text-purple-700">
              총 36문항이며, 각 문항마다 본인에게 가장 가까운 정도를 5점 척도로 선택하시면 됩니다.
            </p>
            <p className="text-sm mb-3 text-gray-700">
              결과는 9개 유형 중 가장 가까운 주 유형, 양옆의 날개 유형, 그리고 9축 레이더 차트로 보고됩니다.
            </p>
            <p className="text-xs mb-4 text-gray-500">
              본 검사는 자가 점검 도구이며 진단 목적으로 사용되지 않습니다. 결과는 응답 시점의 컨디션에 따라 달라질 수 있습니다.
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
                에니어그램 검사
              </h1>
              <span className="text-sm text-gray-500">
                {answeredCount} / {QUESTIONS.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-purple-600 h-full transition-all"
                style={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }}
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
          {(() => {
            const type = TYPES[displayResult.dominant];
            const wing = TYPES[displayResult.wing];
            return (
              <>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 mb-6">
                  <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                    <div className="flex-shrink-0">
                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg">
                        <Image
                          src={characterImageUrl(displayResult.dominant)}
                          alt={type.name}
                          fill
                          sizes="144px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-sm text-purple-700 font-medium mb-1">
                        {displayResult.isShared ? "이 사람의 유형" : "당신의 주 유형"}
                      </p>
                      <h1 className="text-2xl sm:text-3xl font-bold text-purple-900 mb-2">
                        {displayResult.dominant}번. {type.name}
                      </h1>
                      <p className="text-sm text-purple-600 mb-2">
                        {type.englishName}
                      </p>
                      <p className="text-base text-gray-700 mb-2">
                        {type.tagline}
                      </p>
                      <p className="text-xs text-purple-700">
                        날개: {displayResult.wing}번 {wing.name} ({displayResult.dominant}w{displayResult.wing})
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <button
                      onClick={handleShare}
                      className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
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
                    9개 유형 점수
                  </h2>
                  <div className="flex justify-center mb-2">
                    <EnneagramRadarChart
                      scores={displayResult.scores}
                      dominantType={displayResult.dominant}
                    />
                  </div>
                  {displayResult.isShared && (
                    <p className="text-xs text-center text-gray-500 mt-2">
                      공유 결과는 주 유형만 전달되어 점수가 개략 값으로 표시됩니다.
                    </p>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <h2 className="text-lg font-bold text-purple-900 mb-3">
                    유형 소개
                  </h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    {type.summary}
                  </p>
                  {type.description.split("\n\n").map((para, i) => (
                    <p key={i} className="text-gray-700 leading-relaxed mb-3 last:mb-0">
                      {para}
                    </p>
                  ))}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <h2 className="text-lg font-bold text-purple-900 mb-4">
                    핵심 동기와 두려움
                  </h2>
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 mb-3">
                    <h3 className="text-sm font-bold text-purple-800 mb-1">
                      핵심 동기
                    </h3>
                    <p className="text-sm text-purple-900 leading-relaxed">{type.coreMotivation}</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-purple-800 mb-1">
                      핵심 두려움
                    </h3>
                    <p className="text-sm text-purple-900 leading-relaxed">{type.coreFear}</p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <h2 className="text-lg font-bold text-purple-900 mb-4">
                    강점과 유의할 점
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-green-800 mb-2">
                        강점
                      </h3>
                      <ul className="space-y-1 text-sm text-green-900 leading-relaxed">
                        {type.strengths.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-amber-800 mb-2">
                        유의할 점
                      </h3>
                      <ul className="space-y-1 text-sm text-amber-900 leading-relaxed">
                        {type.challenges.map((c, i) => (
                          <li key={i}>• {c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <h2 className="text-lg font-bold text-purple-900 mb-4">
                    스트레스와 안정의 결
                  </h2>
                  <div className="bg-rose-50 border border-rose-100 rounded-lg p-4 mb-3">
                    <h3 className="text-sm font-bold text-rose-800 mb-1">
                      스트레스 상황에서
                    </h3>
                    <p className="text-sm text-rose-900 leading-relaxed">
                      {type.inStress}
                    </p>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-4">
                    <h3 className="text-sm font-bold text-emerald-800 mb-1">
                      안정·건강해질 때
                    </h3>
                    <p className="text-sm text-emerald-900 leading-relaxed">
                      {type.inSecurity}
                    </p>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <h2 className="text-lg font-bold text-purple-900 mb-4">
                    더 자라기 위한 길
                  </h2>
                  <div className="space-y-4 text-sm text-gray-800 leading-relaxed">
                    <div>
                      <h3 className="text-sm font-bold text-purple-800 mb-1">
                        성장의 방향
                      </h3>
                      <p>{type.growthPath}</p>
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                      <h3 className="text-sm font-bold text-purple-800 mb-1">
                        관계 안에서
                      </h3>
                      <p>{type.relationships}</p>
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                      <h3 className="text-sm font-bold text-purple-800 mb-1">
                        일과 환경
                      </h3>
                      <p>{type.workAndCareer}</p>
                    </div>
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
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
