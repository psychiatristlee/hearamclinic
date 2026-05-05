"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"];
const TOTAL_TRIALS = 20;
const N = 2; // 2-back
const STIMULUS_MS = 800;
const ISI_MS = 1700; // 자극 사이 간격

type Status = "ready" | "test" | "result";

interface Trial {
  letter: string;
  isTarget: boolean;
}

function buildTrials(): Trial[] {
  // 약 30% 정도는 N-back 매치(타겟)가 되도록 시퀀스 구성
  const trials: Trial[] = [];
  for (let i = 0; i < TOTAL_TRIALS; i++) {
    let letter: string;
    let isTarget = false;
    if (i >= N && Math.random() < 0.32) {
      letter = trials[i - N].letter;
      isTarget = true;
    } else {
      // N-back과 다른 글자
      const exclude = i >= N ? trials[i - N].letter : "";
      const candidates = LETTERS.filter((l) => l !== exclude);
      letter = candidates[Math.floor(Math.random() * candidates.length)];
    }
    trials.push({ letter, isTarget });
  }
  return trials;
}

export default function NBackTest() {
  const [status, setStatus] = useState<Status>("ready");
  const [trials, setTrials] = useState<Trial[]>([]);
  const [index, setIndex] = useState(0);
  const [showStimulus, setShowStimulus] = useState(true);
  const [responses, setResponses] = useState<boolean[]>([]); // 각 trial에서 사용자가 매치 버튼 눌렀는지
  const responseLockRef = useRef(false);

  const stimulusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (stimulusTimerRef.current) clearTimeout(stimulusTimerRef.current);
    if (isiTimerRef.current) clearTimeout(isiTimerRef.current);
  }, []);

  const startTest = useCallback(() => {
    setTrials(buildTrials());
    setIndex(0);
    setShowStimulus(true);
    setResponses([]);
    responseLockRef.current = false;
    setStatus("test");
  }, []);

  // trial 진행: 자극 표시 → ISI → 다음 trial
  useEffect(() => {
    if (status !== "test") return;
    if (index >= trials.length) {
      setStatus("result");
      return;
    }

    setShowStimulus(true);
    responseLockRef.current = false;

    stimulusTimerRef.current = setTimeout(() => {
      setShowStimulus(false);
      isiTimerRef.current = setTimeout(() => {
        // 사용자가 응답하지 않았으면 false 기록
        setResponses((prev) => {
          if (prev.length <= index) {
            return [...prev, false];
          }
          return prev;
        });
        setIndex((i) => i + 1);
      }, ISI_MS);
    }, STIMULUS_MS);

    return () => {
      clearTimers();
    };
  }, [status, index, trials, clearTimers]);

  const handleMatchClick = () => {
    if (status !== "test") return;
    if (responseLockRef.current) return;
    responseLockRef.current = true;
    setResponses((prev) => {
      if (prev.length <= index) {
        return [...prev, true];
      }
      return prev;
    });
  };

  const reset = () => {
    clearTimers();
    setStatus("ready");
    setTrials([]);
    setIndex(0);
    setResponses([]);
  };

  // 결과 계산
  let hits = 0;
  let misses = 0;
  let falseAlarms = 0;
  let correctRejections = 0;
  trials.forEach((t, i) => {
    const responded = responses[i] === true;
    if (t.isTarget && responded) hits++;
    else if (t.isTarget && !responded) misses++;
    else if (!t.isTarget && responded) falseAlarms++;
    else correctRejections++;
  });
  const targetCount = trials.filter((t) => t.isTarget).length;
  const accuracy = trials.length > 0
    ? Math.round(((hits + correctRejections) / trials.length) * 100)
    : 0;

  return (
    <div className="mx-auto max-w-2xl">
      {status === "ready" && (
        <div>
          <h1 className="text-3xl font-bold text-purple-900 mb-6">
            N-back 검사 (2-back)
          </h1>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">테스트 방법</h3>
            <p className="mb-3 font-medium text-gray-800">
              작업기억과 지속 주의력을 측정하는 검사입니다.
            </p>
            <p className="text-sm mb-3 text-purple-700">
              화면에 글자가 하나씩 나타납니다. <strong>지금 보이는 글자</strong>가 <strong>두 번 전에 나왔던 글자</strong>와 같으면 &quot;매치&quot; 버튼을 눌러주세요.
            </p>
            <div className="bg-white rounded-lg p-4 my-4 text-center">
              <p className="text-sm text-gray-600 mb-2">예시 시퀀스</p>
              <p className="text-2xl font-bold tracking-widest">
                A &nbsp; B &nbsp; <span className="text-purple-600 underline">A</span> &nbsp; C &nbsp; <span className="text-purple-600 underline">C</span>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                3번째 A는 1번째 A와 같으므로 매치, 5번째 C는 3번째 A와 다르므로 패스
              </p>
            </div>
            <p className="text-sm mb-4 font-medium text-purple-700">
              총 20문항, 각 글자는 약 0.8초 동안 보이며 다음 글자까지 약 1.7초의 시간이 있습니다.
            </p>
            <div className="flex justify-center">
              <button
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
                onClick={startTest}
              >
                테스트 시작
              </button>
            </div>
          </div>
        </div>
      )}

      {status === "test" && (
        <div>
          <h1 className="text-purple-900 text-2xl font-bold mb-8 mt-4">
            문항 번호: {Math.min(index + 1, TOTAL_TRIALS)} / {TOTAL_TRIALS}
          </h1>

          <div className="flex justify-center items-center h-48 mb-8 bg-purple-50 rounded-xl">
            <p className="text-7xl font-bold text-purple-900 tracking-wide">
              {showStimulus && index < trials.length ? trials[index].letter : ""}
            </p>
          </div>

          <div className="flex justify-center">
            <button
              className="px-12 py-4 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-bold text-lg rounded-lg transition"
              onClick={handleMatchClick}
            >
              매치 (2번 전과 같음)
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-4">
            매치가 아니라고 판단되면 아무것도 누르지 마세요.
          </p>
        </div>
      )}

      {status === "result" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-purple-900 mb-6">검사 결과</h2>
          <div className="space-y-4 divide-y divide-gray-100">
            <div className="pb-4">
              <p className="text-gray-600 mb-1">정확도</p>
              <p className="text-3xl font-bold text-purple-600">{accuracy}%</p>
            </div>
            <div className="pt-4 pb-4">
              <p className="text-gray-600 mb-1">정답률 (Hit / 전체 매치)</p>
              <p className="text-3xl font-bold text-purple-600">
                {hits} / {targetCount}
              </p>
            </div>
            <div className="pt-4 pb-4">
              <p className="text-gray-600 mb-1">놓친 매치 (Miss)</p>
              <p className="text-2xl font-semibold text-gray-700">{misses}</p>
            </div>
            <div className="pt-4">
              <p className="text-gray-600 mb-1">잘못 누른 횟수 (False alarm)</p>
              <p className="text-2xl font-semibold text-gray-700">{falseAlarms}</p>
            </div>
          </div>
          <button
            className="w-full mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
            onClick={reset}
          >
            다시 테스트하기
          </button>
        </div>
      )}
    </div>
  );
}
