"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import QUESTIONS, {
  SchemaDomain,
  LIKERT_LABELS,
  DOMAIN_ORDER,
} from "@/lib/test/schema/questions";
import {
  DOMAINS,
  SCHEMAS,
  intensityOf,
  coverImageUrl,
  domainImageUrl,
} from "@/lib/test/schema/types";
import SchemaProfileChart from "./SchemaProfileChart";
import { saveTestResult } from "@/lib/test-history";
import { scrollToNextQuestion } from "@/lib/scroll-to-next";
import { useAuth } from "@/lib/AuthContext";
import ResultInsights from "./ResultInsights";
import SaveLoginPrompt from "@/components/auth/SaveLoginPrompt";
import FullBatteryNudge from "./FullBatteryNudge";
import ShareUnlockGate from "./ShareUnlockGate";

type Status = "ready" | "test" | "result";
const QUESTIONS_PER_PAGE = 9;
const VALID: SchemaDomain[] = ["DR", "IA", "IL", "OD", "OI"];
const isValidDomain = (s: string | null | undefined): s is SchemaDomain =>
  !!s && (VALID as string[]).includes(s);

interface DisplayResult {
  domainScores: Record<SchemaDomain, number>;
  schemaScores: Record<number, number>;
  dominant: SchemaDomain;
  topSchemaIds: number[];
  isShared: boolean;
}

export default function SchemaTest() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const sharedCode = searchParams?.get("result") ?? null;
  const initialStatus: Status = isValidDomain(sharedCode) ? "result" : "ready";

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
    if (page < totalPages - 1) { setPage(page + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }
    else { setStatus("result"); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };
  const handlePrev = () => { if (page > 0) { setPage(page - 1); window.scrollTo({ top: 0, behavior: "smooth" }); } };
  const reset = () => { setStatus("ready"); setPage(0); setAnswers({}); };

  const result = useMemo<DisplayResult | null>(() => {
    if (!allAnswered) return null;
    // 도식별 점수 (2문항 평균, 0~100)
    const schemaSum: Record<number, number> = {};
    const schemaCnt: Record<number, number> = {};
    for (const q of QUESTIONS) {
      const a = answers[q.id]; if (a === undefined) continue;
      schemaSum[q.schemaId] = (schemaSum[q.schemaId] ?? 0) + a;
      schemaCnt[q.schemaId] = (schemaCnt[q.schemaId] ?? 0) + 1;
    }
    const schemaScores: Record<number, number> = {};
    for (let id = 1; id <= 18; id++) {
      const cnt = schemaCnt[id] ?? 0;
      const min = cnt; const max = cnt * 5;
      schemaScores[id] = max > min ? Math.round(((schemaSum[id] - min) / (max - min)) * 100) : 0;
    }
    // 영역별 점수 (소속 도식 평균)
    const domainScores = {} as Record<SchemaDomain, number>;
    for (const code of DOMAIN_ORDER) {
      const ids = DOMAINS[code].schemaIds;
      const avg = ids.reduce((s, id) => s + schemaScores[id], 0) / ids.length;
      domainScores[code] = Math.round(avg);
    }
    const dominant = [...DOMAIN_ORDER].sort((a, b) => domainScores[b] - domainScores[a])[0];
    const topSchemaIds = Object.keys(schemaScores)
      .map(Number)
      .sort((a, b) => schemaScores[b] - schemaScores[a])
      .slice(0, 3);
    return { domainScores, schemaScores, dominant, topSchemaIds, isShared: false };
  }, [allAnswered, answers]);

  const sharedResult = useMemo<DisplayResult | null>(() => {
    if (status !== "result" || !isValidDomain(sharedCode) || Object.keys(answers).length > 0) return null;
    const domainScores = {} as Record<SchemaDomain, number>;
    for (const code of DOMAIN_ORDER) domainScores[code] = code === sharedCode ? 82 : 34;
    const schemaScores: Record<number, number> = {};
    for (let id = 1; id <= 18; id++) {
      schemaScores[id] = SCHEMAS[id].domain === sharedCode ? 78 : 32;
    }
    const topSchemaIds = DOMAINS[sharedCode].schemaIds.slice(0, 3);
    return { domainScores, schemaScores, dominant: sharedCode, topSchemaIds, isShared: true };
  }, [status, sharedCode, answers]);

  // 완료 시 결과 저장. 공유 링크(?result=)는 공유 버튼이 직접 URL을 만들므로
  // 브라우저 URL은 건드리지 않는다 → 재검사 시에도 매번 저장되고,
  // 본인 결과 URL이 '공유받은 결과'로 오인되는 문제도 생기지 않는다.
  // user 의존: 결과 화면에서 로그인하면(제자리 팝업) 그 즉시 이 결과가 저장된다.
  const lastSavedRef = useRef<DisplayResult | null>(null);
  useEffect(() => {
    if (!result || status !== "result" || !user) return;
    if (lastSavedRef.current === result) return; // 동일 결과 중복 저장 방지
    lastSavedRef.current = result;
    const dom = DOMAINS[result.dominant];
    const topName = SCHEMAS[result.topSchemaIds[0]]?.name ?? "";
    saveTestResult({
      type: "schema",
      category: "personality",
      displayTitle: "심리도식 검사",
      summary: `${dom.name} · ${topName}`,
      result: {
        dominant: result.dominant,
        domainName: dom.name,
        domainScores: result.domainScores,
        topSchemaIds: result.topSchemaIds,
        schemaScores: result.schemaScores,
      },
    });
  }, [result, status, user]);

  const displayResult = result || sharedResult;

  async function handleShare() {
    if (!displayResult) return;
    setUnlocked(true); // 공유 시 심화 결과 열기
    const url = `${window.location.origin}/personality/schema?result=${displayResult.dominant}`;
    const dom = DOMAINS[displayResult.dominant];
    const shareText = `심리도식 검사 결과: 대표 영역 '${dom.name}'\n${dom.tagline}`;
    if (navigator.share) { try { await navigator.share({ title: `심리도식 검사 - ${dom.name}`, text: shareText, url }); return; } catch { return; } }
    try { await navigator.clipboard.writeText(url); setShareToast("링크가 복사되었습니다"); setTimeout(() => setShareToast(""), 2500); }
    catch { setShareToast("복사 실패"); setTimeout(() => setShareToast(""), 2500); }
  }

  function handleStartFromShared() { router.replace("/personality/schema", { scroll: false }); setStatus("ready"); }

  return (
    <div className="mx-auto max-w-2xl">
      {status === "ready" && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="relative aspect-[16/9] bg-purple-50">
            <Image src={coverImageUrl()} alt="심리도식 검사" fill sizes="(max-width: 768px) 100vw, 672px" className="object-cover" priority unoptimized />
          </div>
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-purple-900 mb-2">심리도식 검사</h1>
            <p className="text-gray-600 mb-6">
              어린 시절에 만들어져 지금도 되풀이되는 마음의 무늬(도식)를 다섯 영역으로 부드럽게 살펴봅니다. 나를 규정하는 판정이 아니라, 나를 이해하는 출발점입니다.
            </p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center"><p className="text-xs text-purple-600 font-medium mb-1">문항 수</p><p className="text-lg font-bold text-purple-900">36문항</p></div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center"><p className="text-xs text-purple-600 font-medium mb-1">소요 시간</p><p className="text-lg font-bold text-purple-900">약 5분</p></div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 text-center"><p className="text-xs text-purple-600 font-medium mb-1">살펴보는 영역</p><p className="text-lg font-bold text-purple-900">18도식·5영역</p></div>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-lg p-3 mb-4">
              <p className="text-xs text-rose-900 leading-relaxed">
                이 검사는 어린 시절의 상처와 마음의 패턴을 다룹니다. 문항을 마주하는 동안 마음이 많이 힘들어지신다면 잠시 멈추셔도 괜찮으며, 필요하시다면 전문가와의 상담을 권해 드립니다.
              </p>
              <p className="text-xs text-rose-800 leading-relaxed mt-1.5">
                지금 많이 힘드시다면 <b>정신건강 상담전화 1577-0199</b>, <b>자살예방 상담전화 109</b>(24시간)로 언제든 도움을 받으실 수 있습니다.
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-6">
              <p className="text-xs text-amber-900 leading-relaxed">본 검사는 자가 이해를 돕는 참고 도구이며 의학적 진단이 아닙니다.</p>
              <p className="text-xs text-amber-800 leading-relaxed mt-1.5">제프리 영(J. Young)이 정립한 심리도식치료 이론의 공개된 개념을 참고해 해람정신건강의학과가 자체 개발한 무료 검사이며, 특정 상용·공인 검사와는 무관하고 그 문항을 사용하지 않습니다.</p>
            </div>
            <button className="w-full px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-xl shadow-md transition" onClick={handleStart}>검사 시작하기</button>
          </div>
        </div>
      )}

      {status === "test" && (
        <div>
          <div className="mb-6 mt-4">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-purple-900 text-xl font-bold">심리도식 검사</h1>
              <span className="text-sm text-gray-500">{answeredCount} / {QUESTIONS.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div className="bg-purple-600 h-full transition-all" style={{ width: `${(answeredCount / QUESTIONS.length) * 100}%` }} />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">최근 몇 년간 나에게 얼마나 들어맞는지 떠올리며 솔직하게 선택해 주세요. 정답은 없습니다.</p>
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
        const dom = DOMAINS[displayResult.dominant];
        const topSchemas = displayResult.topSchemaIds.map((id) => ({ schema: SCHEMAS[id], score: displayResult.schemaScores[id] }));
        const showDeep = displayResult.isShared || unlocked;
        return (
          <div>
            {!displayResult.isShared && <SaveLoginPrompt />}

            {/* 대표 영역 히어로 */}
            <div className="rounded-2xl p-6 mb-6 border" style={{ backgroundColor: dom.softColor, borderColor: dom.color + "40" }}>
              <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                <div className="flex-shrink-0">
                  <div className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-white border-4 border-white shadow-lg">
                    <Image src={domainImageUrl(displayResult.dominant)} alt={dom.name} fill sizes="144px" className="object-cover" unoptimized />
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-sm font-medium mb-1" style={{ color: dom.color }}>{displayResult.isShared ? "이 사람의 대표 영역" : "내 마음에 가장 선명한 영역"}</p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1">{dom.name}</h1>
                  <p className="text-sm text-gray-500 mb-2">{dom.englishName}</p>
                  <p className="text-base text-gray-700 leading-relaxed">{dom.tagline}</p>
                </div>
              </div>
              {showDeep && (
                <div className="mt-5">
                  <button onClick={handleShare} className="w-full px-4 py-2 bg-white/70 hover:bg-white text-gray-800 font-medium rounded-lg transition border border-gray-200">결과 공유하기</button>
                </div>
              )}
              {shareToast && <p className="mt-3 text-sm text-center text-gray-700">{shareToast}</p>}
            </div>

            {displayResult.isShared && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 text-sm text-blue-900">
                공유받은 결과를 보고 계십니다.{" "}
                <button onClick={handleStartFromShared} className="underline font-medium">직접 검사를 진행</button>해 보세요.
              </div>
            )}

            {/* 요약 (간단 결과) */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <p className="text-gray-700 leading-relaxed">{dom.summary}</p>
            </div>

            {!showDeep && <ShareUnlockGate onUnlock={handleShare} />}

            {showDeep && (
              <>

            {/* 5개 도식영역 강도 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-purple-900 mb-1 text-center">다섯 도식영역의 강도</h2>
              <p className="text-xs text-gray-500 mb-5 text-center">누구나 다섯 영역을 정도만 다르게 지니고 있습니다</p>
              <SchemaProfileChart domainScores={displayResult.domainScores} dominant={displayResult.dominant} />
            </div>

            {/* 가장 선명한 도식 (Top 3) */}
            {!displayResult.isShared && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-purple-900 mb-1">가장 선명하게 나타난 마음의 무늬</h2>
                <p className="text-xs text-gray-500 mb-4">18가지 도식 중 지금 나에게 가장 뚜렷하게 나타난 세 가지입니다</p>
                <div className="space-y-4">
                  {topSchemas.map(({ schema, score }) => {
                    const sDom = DOMAINS[schema.domain];
                    return (
                      <div key={schema.id} className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: sDom.color }} />
                          <h3 className="text-base font-bold text-gray-900">{schema.name}</h3>
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: sDom.softColor, color: sDom.color }}>{intensityOf(score)} · {score}</span>
                          <span className="text-[11px] text-gray-400">{sDom.name}</span>
                        </div>
                        <p className="text-sm text-purple-800 font-medium mb-2">“{schema.belief}”</p>
                        <p className="text-sm text-gray-700 leading-relaxed mb-3">{schema.desc}</p>
                        <div className="bg-purple-50 border border-purple-100 rounded-lg p-3">
                          <p className="text-sm text-purple-900 leading-relaxed">🌱 {schema.reframe}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 대표 영역 깊이 읽기 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-purple-900 mb-3">{dom.name} 영역 깊이 읽기</h2>
              <div className="space-y-4 text-sm text-gray-800 leading-relaxed">
                <div><h3 className="text-sm font-bold text-purple-800 mb-1">이 결은 어떻게 만들어질까</h3><p>{dom.rootExperience}</p></div>
                <div className="pt-3 border-t border-gray-100"><h3 className="text-sm font-bold text-purple-800 mb-1">삶과 관계에서 나타나는 모습</h3><p>{dom.innerPattern}</p></div>
                <div className="pt-3 border-t border-gray-100"><h3 className="text-sm font-bold text-purple-800 mb-1">회복의 방향</h3><p>{dom.healingDirection}</p></div>
              </div>
              <div className="mt-4 bg-green-50 border border-green-100 rounded-lg p-4">
                <h3 className="text-sm font-bold text-green-800 mb-1">오늘 해볼 수 있는 작은 돌봄</h3>
                <p className="text-sm text-green-900 leading-relaxed">{dom.careTip}</p>
              </div>
            </div>

            {/* 18도식 전체 프로파일 */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-bold text-purple-900 mb-1">18가지 도식 전체 살펴보기</h2>
              <p className="text-xs text-gray-500 mb-5">영역별로 묶어 본 나의 도식 강도입니다</p>
              <div className="space-y-6">
                {DOMAIN_ORDER.map((code) => {
                  const info = DOMAINS[code];
                  return (
                    <div key={code}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: info.color }} />
                        <h3 className="text-sm font-bold text-gray-800">{info.name}</h3>
                      </div>
                      <div className="space-y-2.5 pl-1">
                        {info.schemaIds.map((id) => {
                          const s = SCHEMAS[id];
                          const score = displayResult.schemaScores[id] ?? 0;
                          return (
                            <div key={id} className="flex items-center gap-3">
                              <span className="text-xs text-gray-700 w-40 flex-shrink-0 truncate">{s.name}</span>
                              <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${Math.max(3, score)}%`, backgroundColor: info.color, opacity: 0.7 }} />
                              </div>
                              <span className="text-xs text-gray-400 w-7 text-right tabular-nums">{score}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {!displayResult.isShared && (
              <ResultInsights
                testType="schema"
                title="내 도식 점수의 변화"
                showComparison={false}
                currentResult={{ domainScores: displayResult.domainScores }}
                metrics={DOMAIN_ORDER.map((code) => ({
                  metricKey: `dom_${code}`,
                  label: DOMAINS[code].name,
                  color: DOMAINS[code].color,
                  extract: (r) => (r.domainScores as Record<string, number>)?.[code],
                  unit: "점",
                  yMin: 0,
                  yMax: 100,
                }))}
              />
            )}

              </>
            )}

            {!displayResult.isShared && (
              <FullBatteryNudge
                href="https://soundary.life/ko/personality?utm_source=hearam.kr"
                emoji="🧭"
                title="다른 마음의 결도 살펴볼까요?"
                desc="에니어그램·DISC·애착 유형 등 다른 성격 검사로 나를 더 입체적으로 만나 보세요. 성격 5종을 마치면 AI 종합 보고서도 받을 수 있어요."
                cta="다른 검사 보러 가기"
              />
            )}

            <div className="flex gap-3">
              <button className="flex-1 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition" onClick={displayResult.isShared ? handleStartFromShared : reset}>
                {displayResult.isShared ? "내 검사 시작하기" : "다시 검사하기"}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">본 결과는 자가 이해를 돕는 참고 도구이며, 의학적 진단을 대체하지 않습니다. 마음이 힘드시다면 전문가와의 상담을 권해 드립니다.</p>
            <p className="text-xs text-gray-500 mt-1 text-center">지금 많이 힘드시다면 정신건강 상담전화 1577-0199 · 자살예방 상담전화 109(24시간)로 도움을 받으실 수 있습니다.</p>
            <p className="text-[11px] text-gray-400 mt-1.5 text-center leading-relaxed">제프리 영(J. Young)의 심리도식치료 이론에 기반한 해람정신건강의학과 자체 개발 무료 검사이며, 특정 상용·공인 검사와는 무관합니다.</p>
          </div>
        );
      })()}
    </div>
  );
}
