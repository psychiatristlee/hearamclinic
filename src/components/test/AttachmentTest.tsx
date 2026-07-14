"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import QUESTIONS, {
  AttachmentDimension,
  LIKERT_LABELS,
} from "@/lib/test/attachment/questions";
import {
  TYPES,
  AttachmentTypeCode,
  characterImageUrl,
  coverImageUrl,
  getTypeFromScores,
} from "@/lib/test/attachment/types";
import AttachmentScatterChart from "./AttachmentScatterChart";
import { saveTestResult } from "@/lib/test-history";
import ResultInsights from "./ResultInsights";
import SaveLoginPrompt from "@/components/auth/SaveLoginPrompt";
import GuidedNextButton from "./GuidedNextButton";
import FullBatteryNudge from "./FullBatteryNudge";
import ShareUnlockGate from "./ShareUnlockGate";

type Status = "ready" | "test" | "result";

const QUESTIONS_PER_PAGE = 8;
const VALID_CODES: AttachmentTypeCode[] = ["secure", "anxious", "avoidant", "disorganized"];

function isValidCode(s: string | null | undefined): s is AttachmentTypeCode {
  return !!s && (VALID_CODES as string[]).includes(s);
}

function scoreOf(value: number, reverse: boolean): number {
  return reverse ? 6 - value : value;
}

export default function AttachmentTest() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sharedCode = searchParams?.get("result") ?? null;
  const initialStatus: Status = isValidCode(sharedCode) ? "result" : "ready";

  const [status, setStatus] = useState<Status>(initialStatus);
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [shareToast, setShareToast] = useState("");
  // 공유하면 심화 결과가 열린다(share-to-unlock)
  const [unlocked, setUnlocked] = useState(false);

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

  const result = useMemo(() => {
    if (!allAnswered) return null;
    const sums: Record<AttachmentDimension, number> = { anxiety: 0, avoidance: 0 };
    const counts: Record<AttachmentDimension, number> = { anxiety: 0, avoidance: 0 };
    for (const q of QUESTIONS) {
      const a = answers[q.id];
      if (a === undefined) continue;
      sums[q.dimension] += scoreOf(a, q.reverse);
      counts[q.dimension] += 1;
    }
    const anxNorm = (sums.anxiety - counts.anxiety) / (counts.anxiety * 4);
    const avoNorm = (sums.avoidance - counts.avoidance) / (counts.avoidance * 4);
    const anxiety = Math.max(0, Math.min(1, anxNorm));
    const avoidance = Math.max(0, Math.min(1, avoNorm));
    const anxietyPercent = Math.round(anxiety * 100);
    const avoidancePercent = Math.round(avoidance * 100);
    const code = getTypeFromScores(anxietyPercent, avoidancePercent);
    return {
      anxiety,
      avoidance,
      anxietyPercent,
      avoidancePercent,
      code,
      isShared: false,
    };
  }, [allAnswered, answers]);

  const sharedResult = useMemo(() => {
    if (
      status !== "result" ||
      !isValidCode(sharedCode) ||
      Object.keys(answers).length > 0
    ) return null;
    // 코드에서 개략적인 위치를 역추정 (시각화용)
    const positions: Record<AttachmentTypeCode, { anxiety: number; avoidance: number }> = {
      secure: { anxiety: 0.25, avoidance: 0.25 },
      anxious: { anxiety: 0.75, avoidance: 0.25 },
      avoidant: { anxiety: 0.25, avoidance: 0.75 },
      disorganized: { anxiety: 0.75, avoidance: 0.75 },
    };
    const pos = positions[sharedCode];
    return {
      anxiety: pos.anxiety,
      avoidance: pos.avoidance,
      anxietyPercent: Math.round(pos.anxiety * 100),
      avoidancePercent: Math.round(pos.avoidance * 100),
      code: sharedCode,
      isShared: true,
    };
  }, [status, sharedCode, answers]);

  useEffect(() => {
    if (result && status === "result" && !sharedCode) {
      // 공유 링크는 공유 버튼이 직접 생성하므로 브라우저 URL은 건드리지 않는다
      const t = TYPES[result.code];
      saveTestResult({
        type: "attachment",
        category: "personality",
        displayTitle: "애착 유형 검사",
        summary: `${t.name} (불안 ${result.anxietyPercent} · 회피 ${result.avoidancePercent})`,
        result: {
          code: result.code,
          anxietyPercent: result.anxietyPercent,
          avoidancePercent: result.avoidancePercent,
          typeName: t.name,
        },
      });
    }
  }, [result, status, sharedCode, router]);

  const displayResult = result || sharedResult;

  async function handleShare() {
    if (!displayResult) return;
    setUnlocked(true); // 공유 시 심화 결과 열기
    const url = `${window.location.origin}/personality/attachment?result=${displayResult.code}`;
    const t = TYPES[displayResult.code];
    const shareText = `애착 유형 검사 결과: ${t.name}\n${t.tagline}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${t.name} - 애착 유형 검사`,
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
    router.replace("/personality/attachment", { scroll: false });
    setStatus("ready");
  }

  return (
    <div className="mx-auto max-w-2xl">
      {status === "ready" && (
        <div>
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="relative aspect-[16/9] bg-purple-50">
              <Image
                src={coverImageUrl()}
                alt="애착 유형 검사"
                fill
                sizes="(max-width: 768px) 100vw, 672px"
                className="object-cover"
                priority
                unoptimized
              />
            </div>
            <div className="p-6 sm:p-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-purple-900 mb-2">
                애착 유형 검사
              </h1>
              <p className="text-gray-600 mb-6">
                관계 속에서 본인이 어떤 마음의 결로 움직이는지 살펴보는 시간
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                  <p className="text-xs text-purple-600 font-medium mb-1">문항 수</p>
                  <p className="text-lg font-bold text-purple-900">24문항</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                  <p className="text-xs text-purple-600 font-medium mb-1">소요 시간</p>
                  <p className="text-lg font-bold text-purple-900">약 4분</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center">
                  <p className="text-xs text-purple-600 font-medium mb-1">유형</p>
                  <p className="text-lg font-bold text-purple-900">4가지</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">1</div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">5점 척도로 답해주세요</p>
                    <p className="text-xs text-gray-500">전혀 그렇지 않다부터 매우 그렇다까지</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">2</div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">불안 × 회피 2차원 분석</p>
                    <p className="text-xs text-gray-500">사분면 차트 위에 본인의 위치 표시</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">3</div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">4개 유형 중 본인 유형 안내</p>
                    <p className="text-xs text-gray-500">관계 패턴, 갈등 대처, 성장의 방향까지</p>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-6">
                <p className="text-xs text-amber-900 leading-relaxed">
                  본 검사는 자가 점검 도구이며 진단 목적으로 사용되지 않습니다. 결과는 응답 시점의 컨디션과 현재 관계 상황에 따라 달라질 수 있습니다.
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
                애착 유형 검사
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

          <p className="text-sm text-gray-600 mb-4">
            최근 또는 일반적인 가까운 관계(연인, 가족, 가까운 친구)를 떠올리며 답해주세요.
          </p>

          <div className="space-y-5">
            {pageQuestions.map((q) => (
              <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-5">
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
                        <span className="text-[10px] leading-tight text-center">{label}</span>
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
            const t = TYPES[displayResult.code];
            const showDeep = displayResult.isShared || unlocked;
            return (
              <>
                {!displayResult.isShared && <GuidedNextButton currentType="attachment" />}
                {!displayResult.isShared && <SaveLoginPrompt />}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 mb-6">
                  <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                    <div className="flex-shrink-0">
                      <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg">
                        <Image
                          src={characterImageUrl(displayResult.code)}
                          alt={t.name}
                          fill
                          sizes="144px"
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <p className="text-sm text-purple-700 font-medium mb-1">
                        {displayResult.isShared ? "이 사람의 유형" : "당신의 애착 유형"}
                      </p>
                      <h1 className="text-2xl sm:text-3xl font-bold text-purple-900 mb-1">
                        {t.name}
                      </h1>
                      <p className="text-sm text-purple-600 mb-2">
                        {t.englishName}
                      </p>
                      <p className="text-base text-gray-700">{t.tagline}</p>
                    </div>
                  </div>

                  {showDeep && (
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
                  )}
                  {shareToast && (
                    <p className="mt-3 text-sm text-center text-purple-700">{shareToast}</p>
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

                {/* 요약 (간단 결과) */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <p className="text-gray-700 leading-relaxed">{t.summary}</p>
                </div>

                {!showDeep && <ShareUnlockGate onUnlock={handleShare} />}

                {showDeep && (
                  <>

                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <h2 className="text-lg font-bold text-purple-900 mb-4 text-center">
                    불안 × 회피 사분면
                  </h2>
                  <div className="flex justify-center mb-3">
                    <AttachmentScatterChart
                      anxiety={displayResult.anxiety}
                      avoidance={displayResult.avoidance}
                      dominantType={displayResult.code}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-center">
                      <p className="text-xs text-purple-600 font-medium mb-1">불안 점수</p>
                      <p className="text-xl font-bold text-purple-900">
                        {displayResult.anxietyPercent}
                      </p>
                    </div>
                    <div className="bg-purple-50 border border-purple-100 rounded-lg p-3 text-center">
                      <p className="text-xs text-purple-600 font-medium mb-1">회피 점수</p>
                      <p className="text-xl font-bold text-purple-900">
                        {displayResult.avoidancePercent}
                      </p>
                    </div>
                  </div>
                  {displayResult.isShared && (
                    <p className="text-xs text-center text-gray-500 mt-3">
                      공유 결과는 사분면 위치가 개략 값으로 표시됩니다.
                    </p>
                  )}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <h2 className="text-lg font-bold text-purple-900 mb-3">유형 소개</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">{t.summary}</p>
                  {t.description.split("\n\n").map((para, i) => (
                    <p key={i} className="text-gray-700 leading-relaxed mb-3 last:mb-0">
                      {para}
                    </p>
                  ))}
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <h2 className="text-lg font-bold text-purple-900 mb-4">강점과 유의할 점</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-green-800 mb-2">강점</h3>
                      <ul className="space-y-1 text-sm text-green-900 leading-relaxed">
                        {t.strengths.map((s, i) => (
                          <li key={i}>• {s}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                      <h3 className="text-sm font-bold text-amber-800 mb-2">유의할 점</h3>
                      <ul className="space-y-1 text-sm text-amber-900 leading-relaxed">
                        {t.challenges.map((c, i) => (
                          <li key={i}>• {c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <h2 className="text-lg font-bold text-purple-900 mb-4">관계와 회복의 결</h2>
                  <div className="space-y-4 text-sm text-gray-800 leading-relaxed">
                    <div>
                      <h3 className="text-sm font-bold text-purple-800 mb-1">관계 안에서</h3>
                      <p>{t.inRelationships}</p>
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                      <h3 className="text-sm font-bold text-purple-800 mb-1">갈등 패턴</h3>
                      <p>{t.conflictPattern}</p>
                    </div>
                    <div className="pt-3 border-t border-gray-100">
                      <h3 className="text-sm font-bold text-purple-800 mb-1">자기 위로 방식</h3>
                      <p>{t.selfSoothing}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
                  <h2 className="text-lg font-bold text-purple-900 mb-3">더 자라기 위한 길</h2>
                  <p className="text-sm text-gray-800 leading-relaxed">{t.growthPath}</p>
                </div>

                {!displayResult.isShared && (
                  <ResultInsights
                    testType="attachment"
                    currentResult={{
                      anxietyPercent: displayResult.anxietyPercent,
                      avoidancePercent: displayResult.avoidancePercent,
                    }}
                    metrics={[
                      {
                        metricKey: "anxiety",
                        label: "불안 점수",
                        color: "rgb(244 63 94)",
                        extract: (r) => r.anxietyPercent as number | undefined,
                        unit: "점",
                        yMin: 0,
                        yMax: 100,
                      },
                      {
                        metricKey: "avoidance",
                        label: "회피 점수",
                        color: "rgb(59 130 246)",
                        extract: (r) => r.avoidancePercent as number | undefined,
                        unit: "점",
                        yMin: 0,
                        yMax: 100,
                      },
                    ]}
                  />
                )}

                  </>
                )}

                {!displayResult.isShared && <FullBatteryNudge />}

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
