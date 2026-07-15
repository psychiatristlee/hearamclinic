"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { saveTestResult } from "@/lib/test-history";
import { contributeAnonStats } from "@/lib/anon-stats";
import { useAuth } from "@/lib/AuthContext";
import SaveLoginPrompt from "@/components/auth/SaveLoginPrompt";
import ResultInsights from "./ResultInsights";

const GRID = 9; // 3×3
const LENGTHS = [3, 4, 5, 6, 7, 8, 9];
const FLASH_MS = 650;
const GAP_MS = 250;

type Status = "ready" | "show" | "input" | "feedback" | "result";

function randSequence(len: number): number[] {
  const seq: number[] = [];
  while (seq.length < len) {
    const c = Math.floor(Math.random() * GRID);
    if (seq[seq.length - 1] === c) continue; // 연속 중복 방지
    seq.push(c);
  }
  return seq;
}

/**
 * 시공간 기억폭 검사 — 블록이 켜진 순서를 기억해 그대로 재현.
 * 3칸부터 시작해 성공할 때마다 한 칸씩 늘어나며, 실패하면 종료.
 * (코르시 블록 태핑 패러다임 기반, 해람 자체 구현)
 */
export default function SpatialSpanTest() {
  const { user } = useAuth();
  const [status, setStatus] = useState<Status>("ready");
  const [lenIdx, setLenIdx] = useState(0);
  const [seq, setSeq] = useState<number[]>([]);
  const [lit, setLit] = useState(-1); // 현재 켜진 블록
  const [input, setInput] = useState<number[]>([]);
  const [lastOk, setLastOk] = useState(true);
  const [span, setSpan] = useState(2); // 최종 기억폭 (실패 시 직전 성공 길이)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current = []; };
  useEffect(() => () => clearTimers(), []);

  const startTrial = useCallback((idx: number) => {
    const s = randSequence(LENGTHS[idx]);
    setSeq(s); setInput([]); setLenIdx(idx); setStatus("show"); setLit(-1);
    clearTimers();
    s.forEach((cell, i) => {
      timers.current.push(setTimeout(() => setLit(cell), i * (FLASH_MS + GAP_MS) + 400));
      timers.current.push(setTimeout(() => setLit(-1), i * (FLASH_MS + GAP_MS) + 400 + FLASH_MS));
    });
    timers.current.push(setTimeout(() => setStatus("input"), s.length * (FLASH_MS + GAP_MS) + 500));
  }, []);

  function pressCell(cell: number) {
    if (status !== "input") return;
    const next = [...input, cell];
    setInput(next);
    // 즉시 판정: 지금까지 누른 것이 순서와 다르면 실패
    if (seq[next.length - 1] !== cell) {
      setLastOk(false);
      setSpan(lenIdx > 0 ? LENGTHS[lenIdx - 1] : 2);
      setStatus("feedback");
      timers.current.push(setTimeout(() => setStatus("result"), 900));
      return;
    }
    if (next.length === seq.length) {
      setLastOk(true);
      if (lenIdx + 1 < LENGTHS.length) {
        setStatus("feedback");
        timers.current.push(setTimeout(() => startTrial(lenIdx + 1), 900));
      } else {
        setSpan(LENGTHS[lenIdx]);
        setStatus("feedback");
        timers.current.push(setTimeout(() => setStatus("result"), 900));
      }
    }
  }

  // 저장 + 익명 규준 (1회)
  const savedRef = useRef(false);
  useEffect(() => {
    if (status !== "result" || savedRef.current) return;
    savedRef.current = true;
    const result = { score: span };
    if (user) {
      saveTestResult({ type: "spatial-span", category: "attention", displayTitle: "시공간 기억 검사", summary: `기억폭 ${span}칸`, result });
    } else {
      contributeAnonStats("spatial-span", result);
    }
  }, [status, span, user]);

  function reset() { savedRef.current = false; clearTimers(); setStatus("ready"); setSpan(2); setLenIdx(0); }

  const grade = span >= 8 ? "매우 우수" : span >= 6 ? "우수" : span >= 5 ? "평균" : span >= 4 ? "평균 하" : "연습 필요";

  const Grid = ({ interactive }: { interactive: boolean }) => (
    <div className="grid grid-cols-3 gap-2.5 max-w-72 mx-auto">
      {Array.from({ length: GRID }, (_, i) => {
        const isLit = lit === i;
        const pressed = interactive && input.includes(i) && input[input.length - 1] === i;
        return (
          <button
            key={i}
            disabled={!interactive}
            onClick={() => pressCell(i)}
            className={`aspect-square rounded-xl border-2 transition-colors duration-150 ${
              isLit ? "bg-purple-600 border-purple-600" :
              pressed ? "bg-purple-300 border-purple-400" :
              "bg-gray-100 border-gray-200"
            } ${interactive ? "hover:border-purple-400 active:bg-purple-200" : ""}`}
            aria-label={`블록 ${i + 1}`}
          />
        );
      })}
    </div>
  );

  return (
    <div className="mx-auto max-w-2xl">
      {status === "ready" && (
        <div>
          <h1 className="text-3xl font-bold text-purple-900 mb-6">시공간 기억 검사</h1>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">테스트 방법</h3>
            <p className="mb-3 font-medium text-gray-800">블록이 <span className="text-purple-700 font-bold">보라색으로 켜지는 순서</span>를 기억했다가, 같은 순서로 눌러 주세요.</p>
            <ul className="text-sm text-purple-700 space-y-1.5 mb-4">
              <li>• 3칸부터 시작해 성공할 때마다 한 칸씩 길어집니다 (최대 9칸)</li>
              <li>• 순서가 틀리는 순간 검사가 끝나고, 직전 성공 길이가 나의 기억폭입니다</li>
              <li>• 일반 성인의 시공간 기억폭은 평균 5칸 안팎입니다</li>
            </ul>
            <div className="flex justify-center">
              <button className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition" onClick={() => startTrial(0)}>테스트 시작</button>
            </div>
          </div>
        </div>
      )}

      {(status === "show" || status === "input" || status === "feedback") && (
        <div className="mt-4">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-bold text-purple-900">시공간 기억 검사</h2>
            <span className="text-sm text-gray-500">{LENGTHS[lenIdx]}칸</span>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <p className="text-sm text-center mb-5 h-5 font-medium text-gray-600">
              {status === "show" && "순서를 잘 보세요…"}
              {status === "input" && `본 순서대로 눌러 주세요 (${input.length}/${seq.length})`}
              {status === "feedback" && (lastOk ? "✅ 정확해요!" : "❌ 아쉬워요")}
            </p>
            <Grid interactive={status === "input"} />
          </div>
        </div>
      )}

      {status === "result" && (
        <div className="mt-4">
          <SaveLoginPrompt message="기록을 저장하고 기억폭 변화 추이를 보려면 로그인해 주세요." />
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 text-center">
            <h2 className="text-2xl font-bold text-purple-900 mb-4">검사 결과</h2>
            <p className="text-sm text-purple-600 mb-1">나의 시공간 기억폭</p>
            <p className="text-5xl font-bold text-purple-900 mb-2">{span}<span className="text-xl font-normal text-purple-500">칸</span></p>
            <p className="text-lg font-bold text-purple-700">{grade}</p>
          </div>

          <ResultInsights
            testType="spatial-span"
            title="내 기억폭과 다른 사람들 비교"
            currentResult={{ score: span }}
            metrics={[{ metricKey: "score", label: "시공간 기억폭", color: "rgb(126 34 206)", extract: (r) => r.score as number, unit: "칸", yMin: 2, yMax: 9 }]}
          />

          <button className="w-full mt-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition" onClick={reset}>다시 테스트하기</button>
          <p className="text-xs text-gray-500 mt-4 text-center">본 검사는 두뇌 활동을 위한 참고 도구이며 의학적 진단이 아닙니다.</p>
        </div>
      )}
    </div>
  );
}
