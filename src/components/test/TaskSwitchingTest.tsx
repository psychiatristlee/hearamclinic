"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { saveTestResult } from "@/lib/test-history";
import { contributeAnonStats } from "@/lib/anon-stats";
import { useAuth } from "@/lib/AuthContext";
import SaveLoginPrompt from "@/components/auth/SaveLoginPrompt";
import ResultInsights from "./ResultInsights";

const TOTAL = 32;
const MAX_RT = 3000;

type Task = "color" | "shape";
type Color = "red" | "blue";
type Shape = "circle" | "square";
type Status = "ready" | "fix" | "stim" | "result";

interface Trial { task: Task; color: Color; shape: Shape; isSwitch: boolean }

function makeTrials(): Trial[] {
  const trials: Trial[] = [];
  let prev: Task = Math.random() < 0.5 ? "color" : "shape";
  for (let i = 0; i < TOTAL; i++) {
    // 약 50% 확률 전환 (첫 시행은 전환 아님)
    const doSwitch = i > 0 && Math.random() < 0.5;
    const task: Task = doSwitch ? (prev === "color" ? "shape" : "color") : prev;
    trials.push({
      task,
      color: Math.random() < 0.5 ? "red" : "blue",
      shape: Math.random() < 0.5 ? "circle" : "square",
      isSwitch: i > 0 && task !== prev,
    });
    prev = task;
  }
  return trials;
}

/**
 * 인지 유연성(과제 전환) 검사 — 시행마다 '색깔' 또는 '모양' 규칙이 바뀐다.
 * 규칙 전환 시행과 반복 시행의 반응시간 차이(전환 비용)로 유연성을 본다.
 */
export default function TaskSwitchingTest() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("ready");
  const [idx, setIdx] = useState(0);
  const [trials, setTrials] = useState<Trial[]>([]);
  const [records, setRecords] = useState<Array<{ ok: boolean; rt: number; isSwitch: boolean }>>([]);
  const stimAt = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // setTimeout 클로저의 stale state 문제를 피하기 위해 ref로 진실을 유지
  const trialsRef = useRef<Trial[]>([]);
  const recordsRef = useRef<Array<{ ok: boolean; rt: number; isSwitch: boolean }>>([]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const answer = useCallback((side: "left" | "right" | null, i: number) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const t = trialsRef.current[i];
    if (!t) return;
    const rt = Math.round(performance.now() - stimAt.current);
    let ok = false;
    if (side) {
      const correctSide: "left" | "right" =
        t.task === "color" ? (t.color === "red" ? "left" : "right") : (t.shape === "circle" ? "left" : "right");
      ok = side === correctSide;
    }
    recordsRef.current = [...recordsRef.current, { ok, rt: Math.min(rt, MAX_RT), isSwitch: t.isSwitch }];
    setRecords(recordsRef.current);
    if (i + 1 >= TOTAL) setStatus("result");
    else showTrial(i + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showTrial = useCallback((i: number) => {
    setIdx(i); setStatus("fix");
    timerRef.current = setTimeout(() => {
      stimAt.current = performance.now();
      setStatus("stim");
      // 시간 초과 = 오답 처리
      timerRef.current = setTimeout(() => answer(null, i), MAX_RT);
    }, 500);
  }, [answer]);

  function start() {
    const t = makeTrials();
    trialsRef.current = t;
    recordsRef.current = [];
    setTrials(t); setRecords([]);
    showTrial(0);
  }

  // 채점
  const correct = records.filter((r) => r.ok).length;
  const accuracy = records.length ? Math.round((correct / records.length) * 100) : 0;
  const okRts = records.filter((r) => r.ok);
  const meanRt = okRts.length ? Math.round(okRts.reduce((a, r) => a + r.rt, 0) / okRts.length) : 0;
  const switchRts = okRts.filter((r) => r.isSwitch);
  const repeatRts = okRts.filter((r) => !r.isSwitch);
  const switchCost =
    switchRts.length && repeatRts.length
      ? Math.round(
          switchRts.reduce((a, r) => a + r.rt, 0) / switchRts.length -
          repeatRts.reduce((a, r) => a + r.rt, 0) / repeatRts.length,
        )
      : 0;

  const savedRef = useRef(false);
  useEffect(() => {
    if (status !== "result" || savedRef.current || !records.length) return;
    savedRef.current = true;
    const result = { score: accuracy, meanTime: meanRt, switchCost };
    if (user) {
      saveTestResult({ type: "task-switching", category: "attention", displayTitle: "인지 유연성 검사", summary: `정확도 ${accuracy}% · 전환비용 ${switchCost}ms`, result });
    } else {
      contributeAnonStats("task-switching", { score: accuracy, meanTime: meanRt });
    }
  }, [status, records, accuracy, meanRt, switchCost, user]);

  function reset() { savedRef.current = false; setStatus("ready"); setRecords([]); setIdx(0); }

  const cur = trials[idx];
  const leftLabel = cur?.task === "color" ? "🔴 빨강" : "⚪ 원";
  const rightLabel = cur?.task === "color" ? "🔵 파랑" : "⬛ 네모";

  return (
    <div className="mx-auto max-w-2xl">
      {status === "ready" && (
        <div>
          <h1 className="text-3xl font-bold text-purple-900 mb-6">인지 유연성 검사 (과제 전환)</h1>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">테스트 방법</h3>
            <p className="mb-3 font-medium text-gray-800">화면 위의 <b>규칙</b>이 시행마다 바뀝니다. 규칙에 맞는 버튼을 최대한 빠르고 정확하게 누르세요.</p>
            <ul className="text-sm text-purple-700 space-y-1.5 mb-3">
              <li>• 규칙이 <b>색깔</b>이면: 빨간 도형 → 왼쪽, 파란 도형 → 오른쪽</li>
              <li>• 규칙이 <b>모양</b>이면: 원 → 왼쪽, 네모 → 오른쪽</li>
              <li>• 총 {TOTAL}시행 · 규칙이 갑자기 바뀔 때 느려지는 정도(전환 비용)를 측정합니다</li>
            </ul>
            <p className="text-xs text-gray-500 mb-4">버튼에 현재 규칙 기준 정답 후보가 표시되니, 도형을 보고 맞는 쪽을 누르시면 됩니다.</p>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition" onClick={start}>테스트 시작</button>
            </div>
          </div>
        </div>
      )}

      {(status === "fix" || status === "stim") && cur && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 text-center mb-3">{idx + 1} / {TOTAL}</p>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className={`text-center mb-6 py-2 rounded-lg font-bold text-lg ${cur.task === "color" ? "bg-rose-50 text-rose-700" : "bg-indigo-50 text-indigo-700"}`}>
              규칙: {cur.task === "color" ? "색깔" : "모양"}
            </div>
            <div className="h-40 flex items-center justify-center">
              {status === "stim" ? (
                cur.shape === "circle" ? (
                  <div className={`w-28 h-28 rounded-full ${cur.color === "red" ? "bg-red-500" : "bg-blue-500"}`} />
                ) : (
                  <div className={`w-28 h-28 rounded-xl ${cur.color === "red" ? "bg-red-500" : "bg-blue-500"}`} />
                )
              ) : (
                <span className="text-4xl text-gray-300 font-bold">+</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
              <button disabled={status !== "stim"} onClick={() => answer("left", idx)} className="py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold rounded-xl text-lg transition">{leftLabel}</button>
              <button disabled={status !== "stim"} onClick={() => answer("right", idx)} className="py-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold rounded-xl text-lg transition">{rightLabel}</button>
            </div>
          </div>
        </div>
      )}

      {status === "result" && (
        <div className="mt-4">
          <SaveLoginPrompt message="기록을 저장하고 유연성 변화 추이를 보려면 로그인해 주세요." />
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-purple-900 mb-6">검사 결과</h2>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <p className="text-xs text-purple-600 mb-1">정확도</p>
                <p className="text-2xl font-bold text-purple-900 tabular-nums">{accuracy}<span className="text-sm font-normal">%</span></p>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <p className="text-xs text-purple-600 mb-1">평균 반응</p>
                <p className="text-2xl font-bold text-purple-900 tabular-nums">{meanRt}<span className="text-sm font-normal">ms</span></p>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <p className="text-xs text-purple-600 mb-1">전환 비용</p>
                <p className="text-2xl font-bold text-purple-900 tabular-nums">{switchCost}<span className="text-sm font-normal">ms</span></p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4 leading-relaxed">
              전환 비용은 규칙이 바뀐 직후 반응이 느려지는 정도입니다. 값이 작을수록 사고의 틀을 빠르게 바꾸는 인지 유연성이 좋은 편입니다. (일반적으로 수십~수백 ms)
            </p>
          </div>

          <ResultInsights
            testType="task-switching"
            title="내 기록과 다른 사람들 비교"
            currentResult={{ score: accuracy, meanTime: meanRt }}
            metrics={[
              { metricKey: "score", label: "정확도", color: "rgb(126 34 206)", extract: (r) => r.score as number, unit: "%", yMin: 0, yMax: 100 },
              { metricKey: "meanTime", label: "평균 반응시간", color: "rgb(59 130 246)", extract: (r) => r.meanTime as number, unit: "ms", lowerIsBetter: true },
            ]}
          />

          <button className="w-full mt-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition" onClick={reset}>다시 테스트하기</button>
          <p className="text-xs text-gray-500 mt-4 text-center">본 검사는 두뇌 활동을 위한 참고 도구이며 의학적 진단이 아닙니다.</p>
        </div>
      )}
    </div>
  );
}
