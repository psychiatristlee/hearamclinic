"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { saveTestResult } from "@/lib/test-history";
import { contributeAnonStats } from "@/lib/anon-stats";
import { useAuth } from "@/lib/AuthContext";
import SaveLoginPrompt from "@/components/auth/SaveLoginPrompt";
import ResultInsights from "./ResultInsights";

const TRIALS = 5;

type Status = "ready" | "waiting" | "go" | "tooSoon" | "between" | "result";

/**
 * 단순 반응속도 검사 — 화면이 초록으로 바뀌는 순간 최대한 빨리 클릭.
 * 총 5회 시행, 평균 반응시간(ms)을 측정한다. (성급 클릭은 해당 시행 재시작)
 */
export default function ReactionTimeTest() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("ready");
  const [trial, setTrial] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [lastMs, setLastMs] = useState<number | null>(null);
  const goAt = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleGo = useCallback(() => {
    setStatus("waiting");
    const delay = 1500 + Math.random() * 2000; // 1.5~3.5초
    timerRef.current = setTimeout(() => {
      goAt.current = performance.now();
      setStatus("go");
    }, delay);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function start() {
    setTimes([]); setTrial(0); setLastMs(null);
    scheduleGo();
  }

  function handlePress() {
    if (status === "waiting") {
      // 성급한 클릭 — 시행 재시작
      if (timerRef.current) clearTimeout(timerRef.current);
      setStatus("tooSoon");
      return;
    }
    if (status === "tooSoon") { scheduleGo(); return; }
    if (status === "go") {
      const ms = Math.round(performance.now() - goAt.current);
      const newTimes = [...times, ms];
      setTimes(newTimes); setLastMs(ms);
      if (newTimes.length >= TRIALS) setStatus("result");
      else { setTrial(newTimes.length); setStatus("between"); }
      return;
    }
    if (status === "between") { scheduleGo(); }
  }

  const mean = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const best = times.length ? Math.min(...times) : 0;

  // 결과 저장 + 익명 규준 기여 (1회)
  const savedRef = useRef(false);
  useEffect(() => {
    if (status !== "result" || savedRef.current || !times.length) return;
    savedRef.current = true;
    const result = { meanTime: mean, best, trials: times };
    if (user) {
      saveTestResult({ type: "reaction-time", category: "attention", displayTitle: "반응속도 검사", summary: `평균 ${mean}ms`, result });
    } else {
      contributeAnonStats("reaction-time", { meanTime: mean });
    }
  }, [status, times, mean, best, user]);

  function reset() { savedRef.current = false; setStatus("ready"); setTimes([]); setTrial(0); setLastMs(null); }

  const grade =
    mean <= 220 ? "매우 빠름" : mean <= 270 ? "빠름" : mean <= 330 ? "보통" : mean <= 400 ? "느긋함" : "여유로움";

  return (
    <div className="mx-auto max-w-2xl">
      {status === "ready" && (
        <div>
          <h1 className="text-3xl font-bold text-purple-900 mb-6">반응속도 검사</h1>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">테스트 방법</h3>
            <p className="mb-3 font-medium text-gray-800">화면이 <span className="text-emerald-600 font-bold">초록색</span>으로 바뀌는 순간, 최대한 빨리 화면을 클릭(터치)하세요.</p>
            <ul className="text-sm text-purple-700 space-y-1.5 mb-4">
              <li>• 빨간 화면일 때 미리 누르면 그 시행은 다시 시작됩니다</li>
              <li>• 총 {TRIALS}회 측정해 평균 반응시간(ms)을 계산합니다</li>
              <li>• 일반 성인의 시각 단순 반응시간은 보통 200~350ms 범위입니다</li>
            </ul>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition" onClick={start}>테스트 시작</button>
            </div>
          </div>
        </div>
      )}

      {(status === "waiting" || status === "go" || status === "tooSoon" || status === "between") && (
        <div>
          <p className="text-sm text-gray-500 text-center mb-3 mt-2">시행 {Math.min(trial + 1, TRIALS)} / {TRIALS}</p>
          <button
            onClick={handlePress}
            className={`w-full h-80 sm:h-96 rounded-2xl flex flex-col items-center justify-center select-none transition-colors text-white ${
              status === "go" ? "bg-emerald-500" : status === "tooSoon" ? "bg-amber-500" : status === "between" ? "bg-purple-600" : "bg-rose-600"
            }`}
          >
            {status === "waiting" && <><span className="text-3xl font-bold mb-2">기다리세요…</span><span className="text-sm opacity-80">초록색이 되면 클릭!</span></>}
            {status === "go" && <span className="text-4xl font-bold">지금 클릭!</span>}
            {status === "tooSoon" && <><span className="text-3xl font-bold mb-2">너무 빨랐어요 😅</span><span className="text-sm opacity-90">클릭해서 이 시행을 다시 시작</span></>}
            {status === "between" && <><span className="text-4xl font-bold mb-2 tabular-nums">{lastMs}ms</span><span className="text-sm opacity-90">클릭해서 다음 시행 진행</span></>}
          </button>
          {times.length > 0 && (
            <p className="text-center text-sm text-gray-500 mt-3">기록: {times.map((t) => `${t}ms`).join(" · ")}</p>
          )}
        </div>
      )}

      {status === "result" && (
        <div>
          <SaveLoginPrompt message="기록을 저장하고 반응속도 변화 추이를 보려면 로그인해 주세요." />
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
            <h2 className="text-2xl font-bold text-purple-900 mb-6">검사 결과</h2>
            <div className="grid grid-cols-3 gap-4 text-center mb-4">
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <p className="text-xs text-purple-600 mb-1">평균</p>
                <p className="text-2xl font-bold text-purple-900 tabular-nums">{mean}<span className="text-sm font-normal">ms</span></p>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <p className="text-xs text-purple-600 mb-1">최고 기록</p>
                <p className="text-2xl font-bold text-purple-900 tabular-nums">{best}<span className="text-sm font-normal">ms</span></p>
              </div>
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                <p className="text-xs text-purple-600 mb-1">평가</p>
                <p className="text-lg font-bold text-purple-900">{grade}</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 text-center">{times.map((t) => `${t}ms`).join(" · ")}</p>
          </div>

          <ResultInsights
            testType="reaction-time"
            title="내 반응속도와 다른 사람들 비교"
            currentResult={{ meanTime: mean }}
            metrics={[{ metricKey: "meanTime", label: "평균 반응시간", color: "rgb(126 34 206)", extract: (r) => r.meanTime as number, unit: "ms", lowerIsBetter: true }]}
          />

          <button className="w-full mt-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition" onClick={reset}>다시 테스트하기</button>
          <p className="text-xs text-gray-500 mt-4 text-center">본 검사는 두뇌 활동을 위한 참고 도구이며 의학적 진단이 아닙니다. 기기·브라우저에 따라 수 ms의 오차가 있을 수 있습니다.</p>
        </div>
      )}
    </div>
  );
}
