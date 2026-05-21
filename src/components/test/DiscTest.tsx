"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import QUESTIONS, {
  DiscDimension,
  LIKERT_LABELS,
} from "@/lib/test/disc/questions";
import { TYPES, characterImageUrl, coverImageUrl } from "@/lib/test/disc/types";
import DiscRadarChart from "./DiscRadarChart";
import { saveTestResult } from "@/lib/test-history";
import ResultInsights from "./ResultInsights";
import SaveLoginPrompt from "@/components/auth/SaveLoginPrompt";

type Status = "ready" | "test" | "result";
const QUESTIONS_PER_PAGE = 8;
const VALID_CODES: DiscDimension[] = ["D", "I", "S", "C"];
const isValidCode = (s: string | null | undefined): s is DiscDimension =>
  !!s && (VALID_CODES as string[]).includes(s);

export default function DiscTest() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sharedCode = searchParams?.get("result") ?? null;
  const initialStatus: Status = isValidCode(sharedCode) ? "result" : "ready";

  const [status, setStatus] = useState<Status>(initialStatus);
  const [page, setPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [shareToast, setShareToast] = useState("");

  const totalPages = Math.ceil(QUESTIONS.length / QUESTIONS_PER_PAGE);
  const pageQuestions = QUESTIONS.slice(page * QUESTIONS_PER_PAGE, (page + 1) * QUESTIONS_PER_PAGE);

  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === QUESTIONS.length;
  const pageAllAnswered = pageQuestions.every((q) => answers[q.id] !== undefined);

  const handleStart = () => { setStatus("test"); setPage(0); setAnswers({}); };
  const handleAnswer = (qid: number, value: number) => setAnswers((p) => ({ ...p, [qid]: value }));
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
    const sums: Record<DiscDimension, number> = { D: 0, I: 0, S: 0, C: 0 };
    const counts: Record<DiscDimension, number> = { D: 0, I: 0, S: 0, C: 0 };
    for (const q of QUESTIONS) {
      const a = answers[q.id]; if (a === undefined) continue;
      sums[q.dimension] += a; counts[q.dimension] += 1;
    }
    const scores: Record<DiscDimension, number> = { D: 0, I: 0, S: 0, C: 0 };
    const percents: Record<DiscDimension, number> = { D: 0, I: 0, S: 0, C: 0 };
    (Object.keys(sums) as DiscDimension[]).forEach((k) => {
      const min = counts[k]; const max = counts[k] * 5;
      const norm = (sums[k] - min) / (max - min);
      scores[k] = norm; percents[k] = Math.round(norm * 100);
    });
    let dominant: DiscDimension = "D";
    (Object.keys(scores) as DiscDimension[]).forEach((k) => { if (scores[k] > scores[dominant]) dominant = k; });
    // 보조 유형: 주 유형 제외 최고
    const others = (Object.keys(scores) as DiscDimension[]).filter((k) => k !== dominant);
    const secondary = others.reduce((best, k) => (scores[k] > scores[best] ? k : best), others[0]);
    return { scores, percents, dominant, secondary, isShared: false };
  }, [allAnswered, answers]);

  const sharedResult = useMemo(() => {
    if (status !== "result" || !isValidCode(sharedCode) || Object.keys(answers).length > 0) return null;
    const scores: Record<DiscDimension, number> = { D: 0.3, I: 0.3, S: 0.3, C: 0.3 };
    scores[sharedCode] = 0.85;
    const percents: Record<DiscDimension, number> = { D: 30, I: 30, S: 30, C: 30 };
    percents[sharedCode] = 85;
    const others = VALID_CODES.filter((k) => k !== sharedCode);
    return { scores, percents, dominant: sharedCode, secondary: others[0], isShared: true };
  }, [status, sharedCode, answers]);

  useEffect(() => {
    if (result && status === "result" && !sharedCode) {
      router.replace(`/personality/disc?result=${result.dominant}`, { scroll: false });
      const t = TYPES[result.dominant];
      saveTestResult({
        type: "disc",
        category: "personality",
        displayTitle: "DISC 행동 유형 검사",
        summary: `${t.name} (${result.dominant}/${result.secondary})`,
        result: {
          dominant: result.dominant,
          secondary: result.secondary,
          percents: result.percents,
          typeName: t.name,
        },
      });
    }
  }, [result, status, sharedCode, router]);

  const displayResult = result || sharedResult;

  async function handleShare() {
    if (!displayResult) return;
    const url = `${window.location.origin}/personality/disc?result=${displayResult.dominant}`;
    const t = TYPES[displayResult.dominant];
    const shareText = `DISC 결과: ${t.name}\n${t.tagline}`;
    if (navigator.share) { try { await navigator.share({ title: `${t.name} - DISC`, text: shareText, url }); return; } catch { return; } }
    try { await navigator.clipboard.writeText(url); setShareToast("링크가 복사되었습니다"); setTimeout(() => setShareToast(""), 2500); }
    catch { setShareToast("복사 실패"); setTimeout(() => setShareToast(""), 2500); }
  }

  function handleStartFromShared() { router.replace("/personality/disc", { scroll: false }); setStatus("ready"); }

  return (
    <div className="mx-auto max-w-2xl">
      {status === "ready" && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="relative aspect-[16/9] bg-purple-50">
            <Image src={coverImageUrl()} alt="DISC 행동 유형 검사" fill sizes="(max-width: 768px) 100vw, 672px" className="object-cover" priority unoptimized />
          </div>
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-purple-900 mb-2">DISC 행동 유형 검사</h1>
            <p className="text-gray-600 mb-6">주도·사교·안정·신중 4가지 행동 양식으로 본인을 살펴봅니다.</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center"><p className="text-xs text-purple-600 font-medium mb-1">문항 수</p><p className="text-lg font-bold text-purple-900">24문항</p></div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center"><p className="text-xs text-purple-600 font-medium mb-1">소요 시간</p><p className="text-lg font-bold text-purple-900">약 4분</p></div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center"><p className="text-xs text-purple-600 font-medium mb-1">유형</p><p className="text-lg font-bold text-purple-900">4가지</p></div>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-6">
              <p className="text-xs text-amber-900 leading-relaxed">본 검사는 자가 점검 도구이며 진단 목적으로 사용되지 않습니다.</p>
            </div>
            <button className="w-full px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-xl shadow-md transition" onClick={handleStart}>검사 시작하기</button>
          </div>
        </div>
      )}

      {status === "test" && (
        <div>
          <div className="mb-6 mt-4">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-purple-900 text-xl font-bold">DISC 검사</h1>
              <span className="text-sm text-gray-500">{answeredCount} / {QUESTIONS.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-purple-600 h-full transition-all" style={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }} />
            </div>
          </div>
          <div className="space-y-5">
            {pageQuestions.map((q) => (
              <div key={q.id} className="bg-white border border-gray-200 rounded-xl p-5">
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
        const sub = TYPES[displayResult.secondary];
        return (
          <div>
            {!displayResult.isShared && <SaveLoginPrompt />}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 mb-6">
              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                <div className="flex-shrink-0">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg">
                    <Image src={characterImageUrl(displayResult.dominant)} alt={t.name} fill sizes="144px" className="object-cover" unoptimized />
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm text-purple-700 font-medium mb-1">{displayResult.isShared ? "이 사람의 유형" : "당신의 주 유형"}</p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-purple-900 mb-1">{displayResult.dominant}. {t.name}</h1>
                  <p className="text-sm text-purple-600 mb-2">{t.englishName}</p>
                  <p className="text-base text-gray-700 mb-2">{t.tagline}</p>
                  <p className="text-xs text-purple-700">보조 유형: {displayResult.secondary}. {sub.name}</p>
                </div>
              </div>
              <div className="mt-5">
                <button onClick={handleShare} className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2">공유하기</button>
              </div>
              {shareToast && <p className="mt-3 text-sm text-center text-purple-700">{shareToast}</p>}
            </div>

            {displayResult.isShared && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-sm text-blue-900">
                공유받은 결과를 보고 계십니다.{" "}
                <button onClick={handleStartFromShared} className="underline font-medium">직접 검사를 진행</button>해 보세요.
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-purple-900 mb-4 text-center">4축 프로필</h2>
              <div className="flex justify-center">
                <DiscRadarChart scores={displayResult.scores} dominantCode={displayResult.dominant} />
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
              <h2 className="text-lg font-bold text-purple-900 mb-4">강점과 유의할 점</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-green-800 mb-2">강점</h3>
                  <ul className="space-y-1 text-sm text-green-900">{t.strengths.map((s, i) => <li key={i}>• {s}</li>)}</ul>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-amber-800 mb-2">유의할 점</h3>
                  <ul className="space-y-1 text-sm text-amber-900">{t.challenges.map((c, i) => <li key={i}>• {c}</li>)}</ul>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-purple-900 mb-4">관계·일·성장</h2>
              <div className="space-y-4 text-sm text-gray-800 leading-relaxed">
                <div><h3 className="text-sm font-bold text-purple-800 mb-1">관계 안에서</h3><p>{t.inRelationships}</p></div>
                <div className="pt-3 border-t border-gray-100"><h3 className="text-sm font-bold text-purple-800 mb-1">일과 환경</h3><p>{t.inWork}</p></div>
                <div className="pt-3 border-t border-gray-100"><h3 className="text-sm font-bold text-purple-800 mb-1">다른 유형과 함께</h3><p>{t.withOthers}</p></div>
                <div className="pt-3 border-t border-gray-100"><h3 className="text-sm font-bold text-purple-800 mb-1">성장의 방향</h3><p>{t.growthPath}</p></div>
              </div>
            </div>

            {!displayResult.isShared && (
              <ResultInsights
                testType="disc"
                currentResult={{ percents: displayResult.percents }}
                metrics={[
                  { metricKey: "dim_D", label: "D (주도)", color: "rgb(244 63 94)", extract: (r) => (r.percents as Record<string, number>)?.D, unit: "점", yMin: 0, yMax: 100 },
                  { metricKey: "dim_I", label: "I (사교)", color: "rgb(245 158 11)", extract: (r) => (r.percents as Record<string, number>)?.I, unit: "점", yMin: 0, yMax: 100 },
                  { metricKey: "dim_S", label: "S (안정)", color: "rgb(16 185 129)", extract: (r) => (r.percents as Record<string, number>)?.S, unit: "점", yMin: 0, yMax: 100 },
                  { metricKey: "dim_C", label: "C (신중)", color: "rgb(59 130 246)", extract: (r) => (r.percents as Record<string, number>)?.C, unit: "점", yMin: 0, yMax: 100 },
                ]}
              />
            )}

            <div className="flex gap-3">
              <button className="flex-1 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition" onClick={displayResult.isShared ? handleStartFromShared : reset}>
                {displayResult.isShared ? "내 검사 시작하기" : "다시 검사하기"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">본 결과는 자가 점검 도구이며, 의학적 진단을 대체하지 않습니다.</p>
          </div>
        );
      })()}
    </div>
  );
}
