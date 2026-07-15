"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VERBAL_ITEMS, type ChoiceItem } from "@/lib/test/iq/verbal";
import { NUMBER_ITEMS } from "@/lib/test/iq/number";
import { MATRIX_ITEMS } from "@/lib/test/iq/matrix";
import MatrixCell from "./MatrixCell";
import { saveTestResult } from "@/lib/test-history";
import { contributeAnonStats } from "@/lib/anon-stats";
import { fetchTestStats, getMetric } from "@/lib/test-stats";
import { useAuth } from "@/lib/AuthContext";
import SaveLoginPrompt from "@/components/auth/SaveLoginPrompt";
import ResultInsights from "../ResultInsights";

type Phase = "ready" | "verbal" | "number" | "matrix" | "memory" | "speed" | "result";

const SECTION_TIME: Record<string, number> = { verbal: 300, number: 420, matrix: 420 };
const SECTION_INFO: Array<{ key: Phase; name: string; desc: string; count: string; time: string }> = [
  { key: "verbal", name: "언어 추리", desc: "단어 사이의 관계를 찾습니다", count: "12문항", time: "5분" },
  { key: "number", name: "수리 추리", desc: "수열의 규칙을 찾습니다", count: "12문항", time: "7분" },
  { key: "matrix", name: "도형 추리", desc: "도형 행렬의 규칙을 찾습니다", count: "10문항", time: "7분" },
  { key: "memory", name: "작업 기억", desc: "숫자를 순서대로/거꾸로 기억합니다", count: "최대 10회", time: "약 4분" },
  { key: "speed", name: "처리 속도", desc: "기호 쌍이 같은지 빠르게 판단합니다", count: "60초", time: "1분" },
];

// 답 선택 시 다음 문항으로 부드럽게 스크롤
function scrollToNext(prefix: string, nextId: number) {
  requestAnimationFrame(() => {
    document.getElementById(`${prefix}-${nextId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

function randDigits(n: number): number[] {
  const out: number[] = [];
  while (out.length < n) {
    const d = Math.floor(Math.random() * 10);
    if (out.length && out[out.length - 1] === d) continue; // 연속 중복 방지
    out.push(d);
  }
  return out;
}

const SPEED_SYMBOLS = ["◆", "●", "▲", "■", "★", "✚", "◐", "◇"];
function makeSpeedPair(): { a: string; b: string; same: boolean } {
  const len = 4;
  const arr = Array.from({ length: len }, () => SPEED_SYMBOLS[Math.floor(Math.random() * SPEED_SYMBOLS.length)]);
  const a = arr.join("");
  const same = Math.random() < 0.5;
  if (same) return { a, b: a, same: true };
  const idx = Math.floor(Math.random() * len);
  let repl = arr[idx];
  while (repl === arr[idx]) repl = SPEED_SYMBOLS[Math.floor(Math.random() * SPEED_SYMBOLS.length)];
  const b = arr.map((c, i) => (i === idx ? repl : c)).join("");
  return { a, b, same: false };
}

const FWD_LENGTHS = [4, 5, 6, 7, 8];
const BWD_LENGTHS = [3, 4, 5, 6, 7];

interface IqScores {
  V: number; N: number; M: number; W: number; S: number;
  composite: number;
  detail: { verbalCorrect: number; numberCorrect: number; matrixCorrect: number; maxF: number; maxB: number; speedScore: number };
}

export default function IqTest() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("ready");

  // 선다형 답안
  const [verbalAns, setVerbalAns] = useState<Record<number, number>>({});
  const [numberAns, setNumberAns] = useState<Record<number, number>>({});
  const [matrixAns, setMatrixAns] = useState<Record<number, number>>({});

  // 섹션 타이머
  const [timeLeft, setTimeLeft] = useState(0);
  useEffect(() => {
    if (!(phase in SECTION_TIME)) return;
    setTimeLeft(SECTION_TIME[phase]);
    const iv = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(iv);
  }, [phase]);
  const nextPhaseOf: Record<string, Phase> = useMemo(() => ({ verbal: "number", number: "matrix", matrix: "memory" }), []);
  useEffect(() => {
    if (phase in SECTION_TIME && timeLeft <= 0) setPhase(nextPhaseOf[phase]);
  }, [timeLeft, phase, nextPhaseOf]);

  // ── 작업 기억 ──
  const [memMode, setMemMode] = useState<"forward" | "backward">("forward");
  const [memIdx, setMemIdx] = useState(0); // 길이 인덱스
  const [memSeq, setMemSeq] = useState<number[]>([]);
  const [memShow, setMemShow] = useState(-1); // 현재 표시 중인 자리 (-1=미표시)
  const [memInput, setMemInput] = useState<number[]>([]);
  const [memState, setMemState] = useState<"intro" | "show" | "input">("intro");
  const [maxF, setMaxF] = useState(3);
  const [maxB, setMaxB] = useState(2);

  const startMemTrial = useCallback((mode: "forward" | "backward", idx: number) => {
    const len = (mode === "forward" ? FWD_LENGTHS : BWD_LENGTHS)[idx];
    const seq = randDigits(len);
    setMemMode(mode); setMemIdx(idx); setMemSeq(seq); setMemInput([]); setMemState("show"); setMemShow(-1);
    seq.forEach((_, i) => {
      setTimeout(() => setMemShow(i), i * 1000 + 300);
      setTimeout(() => setMemShow(-1), i * 1000 + 1100);
    });
    setTimeout(() => setMemState("input"), seq.length * 1000 + 400);
  }, []);

  const finishMemory = useCallback((f: number, b: number) => {
    setMaxF(f); setMaxB(b); setPhase("speed");
  }, []);

  function submitMemInput() {
    const target = memMode === "forward" ? memSeq : [...memSeq].reverse();
    const ok = memInput.length === target.length && memInput.every((d, i) => d === target[i]);
    const lengths = memMode === "forward" ? FWD_LENGTHS : BWD_LENGTHS;
    if (ok) {
      const newMax = lengths[memIdx];
      if (memIdx + 1 < lengths.length) {
        if (memMode === "forward") { setMaxF(newMax); startMemTrial("forward", memIdx + 1); }
        else { setMaxB(newMax); startMemTrial("backward", memIdx + 1); }
      } else if (memMode === "forward") {
        setMaxF(newMax); setMemState("intro"); setMemMode("backward");
      } else {
        finishMemory(maxF, newMax);
      }
    } else {
      if (memMode === "forward") { setMemState("intro"); setMemMode("backward"); }
      else { finishMemory(maxF, maxB); }
    }
  }

  // ── 처리 속도 ──
  const [speedLeft, setSpeedLeft] = useState(60);
  const [speedPair, setSpeedPair] = useState(makeSpeedPair);
  const [speedCorrect, setSpeedCorrect] = useState(0);
  const [speedWrong, setSpeedWrong] = useState(0);
  const speedStarted = useRef(false);
  useEffect(() => {
    if (phase !== "speed") return;
    speedStarted.current = true;
    setSpeedLeft(60); setSpeedCorrect(0); setSpeedWrong(0); setSpeedPair(makeSpeedPair());
    const iv = setInterval(() => setSpeedLeft((t) => t - 1), 1000);
    return () => clearInterval(iv);
  }, [phase]);
  useEffect(() => {
    if (phase === "speed" && speedLeft <= 0) setPhase("result");
  }, [phase, speedLeft]);
  function answerSpeed(saysSame: boolean) {
    if (speedPair.same === saysSame) setSpeedCorrect((c) => c + 1);
    else setSpeedWrong((w) => w + 1);
    setSpeedPair(makeSpeedPair());
  }

  // ── 채점 ──
  const scores: IqScores | null = useMemo(() => {
    if (phase !== "result") return null;
    const vc = VERBAL_ITEMS.filter((q) => verbalAns[q.id] === q.answer).length;
    const nc = NUMBER_ITEMS.filter((q) => numberAns[q.id] === q.answer).length;
    const mc = MATRIX_ITEMS.filter((q) => matrixAns[q.id] === q.answer).length;
    const V = Math.round((vc / VERBAL_ITEMS.length) * 100);
    const N = Math.round((nc / NUMBER_ITEMS.length) * 100);
    const M = Math.round((mc / MATRIX_ITEMS.length) * 100);
    const memRaw = maxF + maxB; // 5~15
    const W = Math.round(((memRaw - 5) / 10) * 100);
    const sScore = Math.max(0, speedCorrect - speedWrong);
    const S = Math.min(100, Math.round((sScore / 40) * 100));
    const composite = Math.round(0.25 * (V + N + M) + 0.125 * (W + S));
    return { V, N, M, W, S, composite, detail: { verbalCorrect: vc, numberCorrect: nc, matrixCorrect: mc, maxF, maxB, speedScore: sScore } };
  }, [phase, verbalAns, numberAns, matrixAns, maxF, maxB, speedCorrect, speedWrong]);

  // ── 규준(표준화) 기반 IQ ──
  const [norm, setNorm] = useState<{ n: number; mean: number; sd: number } | null>(null);
  useEffect(() => {
    if (phase !== "result") return;
    fetchTestStats("iq").then((st) => {
      const m = getMetric(st, "score");
      if (m && m.count > 0) {
        const mean = m.sum / m.count;
        const sd = Math.sqrt(Math.max(m.sumSq / m.count - mean * mean, 1));
        setNorm({ n: m.count, mean, sd });
      }
    });
  }, [phase]);
  const iqEstimate = useMemo(() => {
    if (!scores || !norm || norm.n < 5) return null;
    const z = (scores.composite - norm.mean) / norm.sd;
    return Math.max(55, Math.min(145, Math.round(100 + 15 * z)));
  }, [scores, norm]);

  // ── 저장/통계 기여 (1회) ──
  const savedRef = useRef(false);
  useEffect(() => {
    if (!scores || savedRef.current) return;
    savedRef.current = true;
    const result = {
      score: scores.composite,
      percents: { V: scores.V, N: scores.N, M: scores.M, W: scores.W, S: scores.S },
      ...scores.detail,
    };
    if (user) {
      saveTestResult({ type: "iq", category: "attention", displayTitle: "종합 인지능력 검사", summary: `종합 ${scores.composite}점`, result });
    } else {
      contributeAnonStats("iq", { score: scores.composite, percents: result.percents });
    }
  }, [scores, user]);

  const reset = () => {
    setPhase("ready"); setVerbalAns({}); setNumberAns({}); setMatrixAns({});
    setMaxF(3); setMaxB(2); setMemMode("forward"); setMemState("intro"); setMemIdx(0);
    savedRef.current = false; setNorm(null);
  };

  const fmtTime = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, "0")}`;

  // ── 선다형 섹션 렌더 ──
  function renderChoiceSection(
    title: string, items: ChoiceItem[], ans: Record<number, number>,
    setAns: React.Dispatch<React.SetStateAction<Record<number, number>>>,
    prefix: string, next: Phase, guide: string,
  ) {
    const answered = Object.keys(ans).length;
    return (
      <div>
        <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur border-b border-gray-200 -mx-4 px-4 py-3 mb-5">
          <div className="flex justify-between items-center max-w-2xl mx-auto">
            <h2 className="font-bold text-purple-900">{title}</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{answered}/{items.length}</span>
              <span className={`text-sm font-bold tabular-nums px-2 py-0.5 rounded ${timeLeft <= 30 ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"}`}>⏱ {fmtTime(timeLeft)}</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-600 mb-4">{guide}</p>
        <div className="space-y-5">
          {items.map((q, qi) => (
            <div key={q.id} id={`${prefix}-${q.id}`} className="bg-white border border-gray-200 rounded-xl p-5 scroll-mt-20">
              <p className="text-base font-medium text-gray-800 mb-4">{qi + 1}. {q.question}</p>
              <div className="grid grid-cols-2 gap-2">
                {q.choices.map((c, ci) => {
                  const selected = ans[q.id] === ci;
                  return (
                    <button key={ci} onClick={() => { setAns((p) => ({ ...p, [q.id]: ci })); scrollToNext(prefix, q.id + 1); }}
                      className={`py-3 px-3 rounded-lg border text-sm transition text-left ${selected ? "bg-purple-600 border-purple-600 text-white" : "bg-white border-gray-300 text-gray-700 hover:border-purple-400"}`}>
                      {["①", "②", "③", "④"][ci]} {c}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <button onClick={() => setPhase(next)} className="w-full mt-8 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition">
          다음 섹션으로 →
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4">
      {phase === "ready" && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-sm mt-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-purple-900 mb-2">종합 인지능력 검사</h1>
          <p className="text-gray-600 mb-6">언어·수리·도형 추리와 작업 기억, 처리 속도까지 다섯 영역으로 인지능력을 살펴봅니다. 약 20~25분이 걸리며, 조용한 곳에서 한 번에 진행해 주세요.</p>
          <div className="space-y-2.5 mb-6">
            {SECTION_INFO.map((s, i) => (
              <div key={s.key} className="flex items-center gap-3 bg-purple-50 border border-purple-100 rounded-xl px-4 py-3">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-purple-900">{s.name} <span className="font-normal text-purple-600">· {s.count} · {s.time}</span></p>
                  <p className="text-xs text-gray-600">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 mb-6">
            <p className="text-xs text-amber-900 leading-relaxed">본 검사는 두뇌 활동과 자기 이해를 위한 참고 도구이며, 웩슬러 지능검사 등 임상용 표준화 지능검사를 대체하지 않습니다.</p>
            <p className="text-xs text-amber-800 leading-relaxed mt-1.5">모든 문항은 해람정신건강의학과가 자체 제작했으며, 수검자들의 익명 점수 통계가 쌓일수록 결과의 상대적 위치(편차 IQ)가 정교해집니다.</p>
          </div>
          <button onClick={() => setPhase("verbal")} className="w-full px-8 py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg rounded-xl shadow-md transition">검사 시작하기</button>
        </div>
      )}

      {phase === "verbal" && renderChoiceSection("1. 언어 추리", VERBAL_ITEMS, verbalAns, setVerbalAns, "iqv", "number", "단어 사이의 관계를 파악해 물음표에 들어갈 말을 고르세요.")}
      {phase === "number" && renderChoiceSection("2. 수리 추리", NUMBER_ITEMS, numberAns, setNumberAns, "iqn", "matrix", "수열의 규칙을 찾아 물음표에 들어갈 수를 고르세요.")}

      {phase === "matrix" && (
        <div>
          <div className="sticky top-0 z-10 bg-gray-50/95 backdrop-blur border-b border-gray-200 -mx-4 px-4 py-3 mb-5">
            <div className="flex justify-between items-center max-w-2xl mx-auto">
              <h2 className="font-bold text-purple-900">3. 도형 추리</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">{Object.keys(matrixAns).length}/{MATRIX_ITEMS.length}</span>
                <span className={`text-sm font-bold tabular-nums px-2 py-0.5 rounded ${timeLeft <= 30 ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"}`}>⏱ {fmtTime(timeLeft)}</span>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-4">3×3 도형 배열의 규칙을 찾아, 빈칸(?)에 들어갈 도형을 고르세요.</p>
          <div className="space-y-6">
            {MATRIX_ITEMS.map((item, qi) => (
              <div key={item.id} id={`iqm-${item.id}`} className="bg-white border border-gray-200 rounded-xl p-5 scroll-mt-20">
                <p className="text-base font-medium text-gray-800 mb-3">{qi + 1}.</p>
                <div className="grid grid-cols-3 gap-1.5 max-w-[260px] mx-auto mb-4">
                  {item.grid.map((cell, i) => (
                    <div key={i} className="aspect-square border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center">
                      {cell ? <MatrixCell spec={cell} className="w-full h-full" /> : <span className="text-2xl font-bold text-purple-300">?</span>}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {item.options.map((opt, oi) => {
                    const selected = matrixAns[item.id] === oi;
                    return (
                      <button key={oi} onClick={() => { setMatrixAns((p) => ({ ...p, [item.id]: oi })); scrollToNext("iqm", item.id + 1); }}
                        className={`aspect-square rounded-lg border-2 transition p-1 ${selected ? "border-purple-600 bg-purple-50" : "border-gray-200 bg-white hover:border-purple-300"}`}>
                        <MatrixCell spec={opt} className="w-full h-full" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setPhase("memory")} className="w-full mt-8 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition">다음 섹션으로 →</button>
        </div>
      )}

      {phase === "memory" && (
        <div className="mt-4">
          <h2 className="font-bold text-purple-900 mb-4">4. 작업 기억</h2>
          {memState === "intro" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
              <p className="text-lg font-bold text-gray-900 mb-2">{memMode === "forward" ? "바로 따라 외우기" : "거꾸로 외우기"}</p>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                숫자가 하나씩 나타납니다. 다 본 뒤 {memMode === "forward" ? "본 순서 그대로" : "본 순서와 반대로"} 입력해 주세요.
                {memMode === "backward" && <><br />예: 3 → 7 → 1 을 보셨다면 1, 7, 3 순서로 입력</>}
              </p>
              <button onClick={() => startMemTrial(memMode, 0)} className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition">시작</button>
            </div>
          )}
          {memState === "show" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
              <p className="text-sm text-gray-500 mb-6">{memMode === "forward" ? "순서대로" : "거꾸로"} · {memSeq.length}자리</p>
              <div className="h-32 flex items-center justify-center">
                <span className="text-7xl font-bold text-purple-900 tabular-nums">{memShow >= 0 ? memSeq[memShow] : ""}</span>
              </div>
            </div>
          )}
          {memState === "input" && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-sm text-gray-600 text-center mb-3">{memMode === "forward" ? "본 순서 그대로" : "본 순서와 반대로"} 입력하세요</p>
              <div className="flex justify-center gap-1.5 mb-5 min-h-10">
                {memInput.map((d, i) => <span key={i} className="w-9 h-10 flex items-center justify-center bg-purple-100 text-purple-900 font-bold rounded-lg text-xl tabular-nums">{d}</span>)}
              </div>
              <div className="grid grid-cols-3 gap-2 max-w-60 mx-auto mb-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((d) => (
                  <button key={d} onClick={() => setMemInput((p) => (p.length < memSeq.length ? [...p, d] : p))}
                    className={`py-3 rounded-lg border border-gray-300 text-lg font-bold text-gray-800 hover:bg-purple-50 transition ${d === 0 ? "col-start-2" : ""}`}>{d}</button>
                ))}
              </div>
              <div className="flex gap-2 max-w-60 mx-auto">
                <button onClick={() => setMemInput((p) => p.slice(0, -1))} className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition">← 지우기</button>
                <button onClick={submitMemInput} disabled={memInput.length !== memSeq.length} className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-sm font-bold rounded-lg transition">확인</button>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === "speed" && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-purple-900">5. 처리 속도</h2>
            <span className={`text-sm font-bold tabular-nums px-2 py-0.5 rounded ${speedLeft <= 10 ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"}`}>⏱ {speedLeft}초</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">두 기호 묶음이 같으면 「같다」, 하나라도 다르면 「다르다」를 최대한 빠르고 정확하게 누르세요.</p>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="flex items-center justify-center gap-6 py-8 select-none">
              <span className="text-3xl sm:text-4xl tracking-widest text-gray-900">{speedPair.a}</span>
              <span className="text-gray-300 text-2xl">|</span>
              <span className="text-3xl sm:text-4xl tracking-widest text-gray-900">{speedPair.b}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => answerSpeed(true)} className="py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-lg transition">같다</button>
              <button onClick={() => answerSpeed(false)} className="py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-lg transition">다르다</button>
            </div>
            <p className="text-xs text-gray-400 text-center mt-3">맞힘 {speedCorrect} · 틀림 {speedWrong}</p>
          </div>
        </div>
      )}

      {phase === "result" && scores && (
        <div className="mt-4">
          <SaveLoginPrompt message="결과를 저장하고 재검사 때 변화 추이를 확인하려면 로그인해 주세요. (익명 점수는 규준 통계에만 반영됩니다)" />

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 mb-6 text-center">
            <p className="text-sm text-purple-700 font-medium mb-1">종합 인지 점수</p>
            <p className="text-5xl font-bold text-purple-900 mb-2">{scores.composite}<span className="text-xl font-normal text-purple-500"> / 100</span></p>
            {iqEstimate !== null && norm ? (
              <div className="mt-3">
                <p className="text-sm text-purple-700 font-medium">{norm.n >= 30 ? "표준화 편차 IQ (해람 규준)" : "예비 추정 IQ (규준 수집 중)"}</p>
                <p className="text-3xl font-bold text-purple-900">{iqEstimate}</p>
                <p className="text-xs text-purple-600 mt-1">수검자 {norm.n.toLocaleString()}명의 분포 기준 · 평균 100, 표준편차 15</p>
              </div>
            ) : (
              <p className="text-xs text-purple-600 mt-2">규준(표준화) 수집 중 — 수검자가 더 모이면 IQ 환산 점수가 표시됩니다.</p>
            )}
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-bold text-purple-900 mb-4">영역별 프로필</h2>
            <div className="space-y-4">
              {([
                ["언어 추리", scores.V, `${scores.detail.verbalCorrect}/${VERBAL_ITEMS.length} 정답`],
                ["수리 추리", scores.N, `${scores.detail.numberCorrect}/${NUMBER_ITEMS.length} 정답`],
                ["도형 추리", scores.M, `${scores.detail.matrixCorrect}/${MATRIX_ITEMS.length} 정답`],
                ["작업 기억", scores.W, `바로 ${scores.detail.maxF}자리 · 거꾸로 ${scores.detail.maxB}자리`],
                ["처리 속도", scores.S, `${scores.detail.speedScore}점 (맞힘−틀림)`],
              ] as Array<[string, number, string]>).map(([name, val, sub]) => (
                <div key={name}>
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="text-sm font-medium text-gray-800">{name}</span>
                    <span className="text-sm font-bold text-purple-700 tabular-nums">{val}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div className="h-full bg-purple-600 rounded-full transition-all duration-700" style={{ width: `${Math.max(3, val)}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>

          <ResultInsights
            testType="iq"
            title="내 점수와 다른 수검자 비교"
            currentResult={{ score: scores.composite, percents: { V: scores.V, N: scores.N, M: scores.M, W: scores.W, S: scores.S } }}
            metrics={[
              { metricKey: "score", label: "종합 인지 점수", color: "rgb(126 34 206)", extract: (r) => r.score as number, unit: "점", yMin: 0, yMax: 100 },
            ]}
          />

          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition">다시 검사하기</button>
          </div>
          <p className="text-xs text-gray-500 mt-4 text-center">본 결과는 두뇌 활동·자기 이해를 위한 참고용이며, 임상 지능검사(웩슬러 등)를 대체하지 않습니다. 정확한 평가가 필요하시면 전문기관 검사를 권해 드립니다.</p>
          <p className="text-[11px] text-gray-400 mt-1.5 text-center leading-relaxed">해람정신건강의학과 자체 개발 검사 · 특정 상용·공인 지능검사와 무관하며 그 문항을 사용하지 않습니다.</p>
        </div>
      )}
    </div>
  );
}
