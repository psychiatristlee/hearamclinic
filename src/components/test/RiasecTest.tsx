"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import QUESTIONS, {
  RiasecCode,
  LIKERT_LABELS,
  RIASEC_ORDER,
} from "@/lib/test/riasec/questions";
import { TYPES, characterImageUrl, coverImageUrl } from "@/lib/test/riasec/types";
import RiasecRadarChart from "./RiasecRadarChart";
import { saveTestResult } from "@/lib/test-history";
import { scrollToNextQuestion } from "@/lib/scroll-to-next";
import ResultInsights from "./ResultInsights";
import SaveLoginPrompt from "@/components/auth/SaveLoginPrompt";
import GuidedNextButton from "./GuidedNextButton";
import FullBatteryNudge from "./FullBatteryNudge";
import ShareUnlockGate from "./ShareUnlockGate";

type Status = "ready" | "test" | "result";
const QUESTIONS_PER_PAGE = 9;
const VALID_CODES: RiasecCode[] = ["R", "I", "A", "S", "E", "C"];
const isValidCode = (s: string | null | undefined): s is RiasecCode =>
  !!s && (VALID_CODES as string[]).includes(s);

export default function RiasecTest() {
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
  const pageQuestions = QUESTIONS.slice(page * QUESTIONS_PER_PAGE, (page + 1) * QUESTIONS_PER_PAGE);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === QUESTIONS.length;
  const pageAllAnswered = pageQuestions.every((q) => answers[q.id] !== undefined);

  const handleStart = () => { setStatus("test"); setPage(0); setAnswers({}); };
  const handleAnswer = (qid: number, value: number) => {
    setAnswers((p) => ({ ...p, [qid]: value }));
    scrollToNextQuestion(qid);
  };
  const handleNext = () => {
    if (page < totalPages - 1) {
      setPage(page + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setStatus("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const handlePrev = () => { if (page > 0) { setPage(page - 1); window.scrollTo({ top: 0, behavior: "smooth" }); } };
  const reset = () => { setStatus("ready"); setPage(0); setAnswers({}); };

  const result = useMemo(() => {
    if (!allAnswered) return null;
    const sums: Record<RiasecCode, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    const counts: Record<RiasecCode, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    for (const q of QUESTIONS) {
      const a = answers[q.id]; if (a === undefined) continue;
      sums[q.code] += a; counts[q.code] += 1;
    }
    const scores: Record<RiasecCode, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    const percents: Record<RiasecCode, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
    (Object.keys(sums) as RiasecCode[]).forEach((k) => {
      const min = counts[k]; const max = counts[k] * 5;
      const norm = (sums[k] - min) / (max - min);
      scores[k] = norm; percents[k] = Math.round(norm * 100);
    });
    // 상위 3유형 (Holland code)
    const ranked = [...VALID_CODES].sort((a, b) => scores[b] - scores[a]);
    const dominant = ranked[0];
    const secondary = ranked[1];
    const tertiary = ranked[2];
    return { scores, percents, dominant, secondary, tertiary, hollandCode: `${dominant}${secondary}${tertiary}`, isShared: false };
  }, [allAnswered, answers]);

  const sharedResult = useMemo(() => {
    if (status !== "result" || !isValidCode(sharedCode) || Object.keys(answers).length > 0) return null;
    const scores: Record<RiasecCode, number> = { R: 0.3, I: 0.3, A: 0.3, S: 0.3, E: 0.3, C: 0.3 };
    scores[sharedCode] = 0.85;
    const percents: Record<RiasecCode, number> = { R: 30, I: 30, A: 30, S: 30, E: 30, C: 30 };
    percents[sharedCode] = 85;
    const others = VALID_CODES.filter((k) => k !== sharedCode);
    return { scores, percents, dominant: sharedCode, secondary: others[0], tertiary: others[1], hollandCode: `${sharedCode}${others[0]}${others[1]}`, isShared: true };
  }, [status, sharedCode, answers]);

  useEffect(() => {
    if (result && status === "result" && !sharedCode) {
      // 공유 링크는 공유 버튼이 직접 생성하므로 브라우저 URL은 건드리지 않는다
      const t = TYPES[result.dominant];
      saveTestResult({
        type: "riasec",
        category: "personality",
        displayTitle: "직업흥미 검사 (RIASEC)",
        summary: `${t.name} (${result.hollandCode})`,
        result: {
          dominant: result.dominant,
          secondary: result.secondary,
          tertiary: result.tertiary,
          hollandCode: result.hollandCode,
          percents: result.percents,
          typeName: t.name,
        },
      });
    }
  }, [result, status, sharedCode, router]);

  const displayResult = result || sharedResult;

  async function handleShare() {
    if (!displayResult) return;
    setUnlocked(true); // 공유 시 심화 결과 열기
    const url = `${window.location.origin}/personality/riasec?result=${displayResult.dominant}`;
    const t = TYPES[displayResult.dominant];
    const shareText = `직업흥미 검사(RIASEC) 결과: ${t.name}\n${t.tagline}`;
    if (navigator.share) { try { await navigator.share({ title: `${t.name} - 직업흥미 검사`, text: shareText, url }); return; } catch { return; } }
    try { await navigator.clipboard.writeText(url); setShareToast("링크가 복사되었습니다"); setTimeout(() => setShareToast(""), 2500); }
    catch { setShareToast("복사 실패"); setTimeout(() => setShareToast(""), 2500); }
  }

  function handleStartFromShared() { router.replace("/personality/riasec", { scroll: false }); setStatus("ready"); }

  return (
    <div className="mx-auto max-w-2xl">
      {status === "ready" && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="relative aspect-[16/9] bg-purple-50">
            <Image src={coverImageUrl()} alt="직업흥미 검사 RIASEC" fill sizes="(max-width: 768px) 100vw, 672px" className="object-cover" priority unoptimized />
          </div>
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-purple-900 mb-2">직업흥미 검사 (RIASEC)</h1>
            <p className="text-gray-600 mb-6">여섯 가지 직업 흥미 유형으로 나에게 맞는 일의 결을 살펴봅니다.</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center"><p className="text-xs text-purple-600 font-medium mb-1">문항 수</p><p className="text-lg font-bold text-purple-900">36문항</p></div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center"><p className="text-xs text-purple-600 font-medium mb-1">소요 시간</p><p className="text-lg font-bold text-purple-900">약 5분</p></div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center"><p className="text-xs text-purple-600 font-medium mb-1">유형</p><p className="text-lg font-bold text-purple-900">6가지</p></div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-6">
              <p className="text-xs text-amber-900 leading-relaxed">본 검사는 자가 점검 도구이며 진단 목적으로 사용되지 않습니다.</p>
              <p className="text-xs text-amber-800 leading-relaxed mt-1.5">홀랜드(J. Holland)의 직업흥미 이론에 기반하여 해람정신건강의학과가 자체 개발한 무료 검사이며, 특정 상용·공공 직업흥미 검사와는 무관합니다.</p>
            </div>
            <button className="w-full px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-xl shadow-md transition" onClick={handleStart}>검사 시작하기</button>
          </div>
        </div>
      )}

      {status === "test" && (
        <div>
          <div className="mb-6 mt-4">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-purple-900 text-xl font-bold">직업흥미 검사</h1>
              <span className="text-sm text-gray-500">{answeredCount} / {QUESTIONS.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-purple-600 h-full transition-all" style={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">각 활동에 얼마나 흥미가 있으신지 솔직하게 선택해 주세요.</p>
          <div className="space-y-5">
            {pageQuestions.map((q) => (
              <div key={q.id} id={`q-${q.id}`} className="bg-white border border-gray-200 rounded-xl p-5">
                <p className="text-base font-medium text-gray-800 mb-4">{q.id}. {q.text}</p>
                <div className="grid grid-cols-5 gap-2">
                  {LIKERT_LABELS.map((label, i) => {
                    const value = i + 1; const selected = answers[q.id] === value;
                    return (
                      <button key={value} onClick={() => handleAnswer(q.id, value)} className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg border transition text-xs ${selected ? "bg-purple-600 border-purple-600 text-white" : "bg-white border-gray-300 text-gray-700 hover:border-purple-400"}`}>
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
            <button onClick={handlePrev} disabled={page === 0} className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition">이전</button>
            <button onClick={handleNext} disabled={!pageAllAnswered} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 transition">{page === totalPages - 1 ? "결과 보기" : "다음"}</button>
          </div>
        </div>
      )}

      {status === "result" && displayResult && (() => {
        const t = TYPES[displayResult.dominant];
        const sec = TYPES[displayResult.secondary];
        const ter = TYPES[displayResult.tertiary];
        const showDeep = displayResult.isShared || unlocked;
        return (
          <div>
            {!displayResult.isShared && <GuidedNextButton currentType="riasec" />}
            {!displayResult.isShared && <SaveLoginPrompt />}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                <div className="flex-shrink-0">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg">
                    <Image src={characterImageUrl(displayResult.dominant)} alt={t.name} fill sizes="144px" className="object-cover" unoptimized />
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm text-purple-700 font-medium mb-1">{displayResult.isShared ? "이 사람의 유형" : "당신의 대표 흥미 유형"}</p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-purple-900 mb-1">{displayResult.dominant}. {t.name}</h1>
                  <p className="text-sm text-purple-600 mb-2">{t.englishName}</p>
                  <p className="text-base text-gray-700 mb-2">{t.tagline}</p>
                  {!displayResult.isShared && (
                    <p className="text-xs text-purple-700">
                      홀랜드 코드: <span className="font-bold">{displayResult.hollandCode}</span> ({t.name} · {sec.name} · {ter.name})
                    </p>
                  )}
                </div>
              </div>
              {showDeep && (
                <div className="mt-5">
                  <button onClick={handleShare} className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2">공유하기</button>
                </div>
              )}
              {shareToast && <p className="mt-3 text-sm text-center text-purple-700">{shareToast}</p>}
            </div>

            {displayResult.isShared && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-sm text-blue-900">
                공유받은 결과를 보고 계십니다.{" "}
                <button onClick={handleStartFromShared} className="underline font-medium">직접 검사를 진행</button>해 보세요.
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
              <h2 className="text-lg font-bold text-purple-900 mb-4 text-center">여섯 가지 흥미 프로필</h2>
              <div className="flex justify-center">
                <RiasecRadarChart scores={displayResult.scores} dominantCode={displayResult.dominant} />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-purple-900 mb-3">유형 소개</h2>
              <p className="text-gray-700 leading-relaxed mb-4">{t.summary}</p>
              {t.description.split("\n\n").map((para, i) => (
                <p key={i} className="text-gray-700 leading-relaxed mb-3 last:mb-0">{para}</p>
              ))}
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-purple-900 mb-4">강점</h2>
              <ul className="space-y-1.5 text-sm text-green-900 bg-green-50 border border-green-100 rounded-lg p-4">
                {t.strengths.map((s, i) => <li key={i}>• {s}</li>)}
              </ul>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-purple-900 mb-1">잘 맞는 직업·분야</h2>
              <p className="text-xs text-gray-500 mb-4">{t.name}의 흥미와 잘 어울리는 직업 예시입니다</p>
              <div className="flex flex-wrap gap-2">
                {t.careers.map((c) => (
                  <span key={c} className="text-sm px-3 py-1.5 bg-purple-50 text-purple-700 border border-purple-100 rounded-full">{c}</span>
                ))}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-purple-900 mb-4">일하는 방식과 성장</h2>
              <div className="space-y-4 text-sm text-gray-800 leading-relaxed">
                <div><h3 className="text-sm font-bold text-purple-800 mb-1">잘 맞는 일 환경</h3><p>{t.workStyle}</p></div>
                <div className="pt-3 border-t border-gray-100"><h3 className="text-sm font-bold text-purple-800 mb-1">성장을 위한 한 걸음</h3><p>{t.growthTip}</p></div>
              </div>
            </div>

            {!displayResult.isShared && (
              <ResultInsights
                testType="riasec"
                currentResult={{ percents: displayResult.percents }}
                metrics={RIASEC_ORDER.map((code) => ({
                  metricKey: `dim_${code}`,
                  label: `${code} ${TYPES[code].name}`,
                  color: {
                    R: "rgb(132 138 60)", I: "rgb(59 130 246)", A: "rgb(168 85 247)",
                    S: "rgb(244 114 92)", E: "rgb(234 88 12)", C: "rgb(20 160 160)",
                  }[code],
                  extract: (r) => (r.percents as Record<string, number>)?.[code],
                  unit: "점",
                  yMin: 0,
                  yMax: 100,
                }))}
              />
            )}

              </>
            )}

            {!displayResult.isShared && <FullBatteryNudge />}

            <div className="flex gap-3">
              <button className="flex-1 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition" onClick={displayResult.isShared ? handleStartFromShared : reset}>
                {displayResult.isShared ? "내 검사 시작하기" : "다시 검사하기"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">본 결과는 자가 점검 도구이며, 의학적 진단을 대체하지 않습니다.</p>
            <p className="text-[11px] text-gray-400 mt-1.5 text-center leading-relaxed">홀랜드(J. Holland)의 직업흥미 이론에 기반한 해람정신건강의학과 자체 개발 무료 검사이며, 특정 상용·공공 직업흥미 검사와는 무관합니다.</p>
          </div>
        );
      })()}
    </div>
  );
}
