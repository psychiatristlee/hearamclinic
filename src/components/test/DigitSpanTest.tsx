"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";

const START_LENGTH = 3;
const MAX_LENGTH = 10;
const DIGIT_DISPLAY_MS = 800;
const ISI_MS = 400;

type Status = "ready" | "showing" | "input" | "feedback" | "result";

function generateSequence(length: number): number[] {
  const arr: number[] = [];
  let prev = -1;
  for (let i = 0; i < length; i++) {
    let n = Math.floor(Math.random() * 10);
    while (n === prev) {
      n = Math.floor(Math.random() * 10);
    }
    arr.push(n);
    prev = n;
  }
  return arr;
}

export default function DigitSpanTest() {
  const [status, setStatus] = useState<Status>("ready");
  const [length, setLength] = useState(START_LENGTH);
  const [sequence, setSequence] = useState<number[]>([]);
  const [showIndex, setShowIndex] = useState(0); // 현재 표시중인 숫자 인덱스
  const [showOn, setShowOn] = useState(true); // ISI 동안 false
  const [input, setInput] = useState<number[]>([]);
  const [bestLength, setBestLength] = useState(0);
  const [failuresAtCurrent, setFailuresAtCurrent] = useState(0);
  const [lastFeedback, setLastFeedback] = useState<"correct" | "wrong" | null>(null);
  const [trialCount, setTrialCount] = useState(0);

  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearStepTimer = useCallback(() => {
    if (stepTimerRef.current) clearTimeout(stepTimerRef.current);
  }, []);

  const startNextSequence = useCallback((nextLength: number) => {
    const seq = generateSequence(nextLength);
    setSequence(seq);
    setShowIndex(0);
    setShowOn(true);
    setInput([]);
    setStatus("showing");
  }, []);

  const startTest = () => {
    setLength(START_LENGTH);
    setBestLength(0);
    setFailuresAtCurrent(0);
    setTrialCount(0);
    startNextSequence(START_LENGTH);
  };

  // 시퀀스 보여주기 진행
  useEffect(() => {
    if (status !== "showing") return;
    if (showIndex >= sequence.length) {
      // 모두 보여줬으면 입력 단계로
      setStatus("input");
      return;
    }

    if (showOn) {
      stepTimerRef.current = setTimeout(() => {
        setShowOn(false);
      }, DIGIT_DISPLAY_MS);
    } else {
      stepTimerRef.current = setTimeout(() => {
        setShowOn(true);
        setShowIndex((i) => i + 1);
      }, ISI_MS);
    }

    return () => {
      clearStepTimer();
    };
  }, [status, showIndex, showOn, sequence.length, clearStepTimer]);

  const handleDigitInput = (digit: number) => {
    if (status !== "input") return;
    const next = [...input, digit];
    setInput(next);
    if (next.length === sequence.length) {
      const correct = next.every((d, i) => d === sequence[i]);
      setLastFeedback(correct ? "correct" : "wrong");
      setStatus("feedback");
      setTrialCount((c) => c + 1);

      setTimeout(() => {
        if (correct) {
          setBestLength((b) => Math.max(b, sequence.length));
          setFailuresAtCurrent(0);
          if (sequence.length >= MAX_LENGTH) {
            setStatus("result");
          } else {
            const newLength = sequence.length + 1;
            setLength(newLength);
            startNextSequence(newLength);
          }
        } else {
          const failures = failuresAtCurrent + 1;
          if (failures >= 2) {
            setStatus("result");
          } else {
            setFailuresAtCurrent(failures);
            startNextSequence(sequence.length);
          }
        }
      }, 1200);
    }
  };

  const handleBackspace = () => {
    if (status !== "input") return;
    setInput((prev) => prev.slice(0, -1));
  };

  const reset = () => {
    clearStepTimer();
    setStatus("ready");
    setSequence([]);
    setInput([]);
    setBestLength(0);
    setFailuresAtCurrent(0);
    setLength(START_LENGTH);
    setLastFeedback(null);
    setTrialCount(0);
  };

  const currentDigit =
    status === "showing" && showOn && showIndex < sequence.length ?
      sequence[showIndex] :
      null;

  return (
    <div className="mx-auto max-w-2xl">
      {status === "ready" && (
        <div>
          <h1 className="text-3xl font-bold text-purple-900 mb-6">
            숫자 폭 검사 (Digit Span)
          </h1>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">테스트 방법</h3>
            <p className="mb-3 font-medium text-gray-800">
              단기기억과 주의 지속 능력을 측정하는 검사입니다.
            </p>
            <p className="text-sm mb-3 text-purple-700">
              화면에 숫자가 하나씩 차례로 나타납니다. 모두 보여진 다음, <strong>본 순서대로</strong> 숫자를 눌러주세요.
            </p>
            <p className="text-sm mb-3 text-gray-700">
              {START_LENGTH}자리부터 시작해 정답을 맞히면 한 자리씩 늘어납니다. 같은 길이에서 두 번 틀리면 검사가 종료됩니다.
            </p>
            <p className="text-sm mb-4 font-medium text-purple-700">
              최대 {MAX_LENGTH}자리까지 도전할 수 있습니다.
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

      {(status === "showing" || status === "input" || status === "feedback") && (
        <div>
          <h1 className="text-purple-900 text-2xl font-bold mb-4 mt-4">
            현재 자릿수: {sequence.length}자리
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            시도 횟수: {trialCount} · 최고 기록: {bestLength}자리
          </p>

          <div className="flex justify-center items-center h-48 mb-6 bg-purple-50 rounded-xl">
            {status === "showing" && (
              <p className="text-8xl font-bold text-purple-900">
                {currentDigit !== null ? currentDigit : ""}
              </p>
            )}
            {status === "input" && (
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">본 순서대로 입력하세요</p>
                <p className="text-4xl font-bold text-purple-900 tracking-widest">
                  {input.length === 0 ?
                    Array(sequence.length).fill("_").join(" ") :
                    input.join(" ")}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {input.length} / {sequence.length}
                </p>
              </div>
            )}
            {status === "feedback" && (
              <p
                className={`text-4xl font-bold ${
                  lastFeedback === "correct" ? "text-green-600" : "text-red-600"
                }`}
              >
                {lastFeedback === "correct" ? "정답!" : "오답"}
              </p>
            )}
          </div>

          {status === "input" && (
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
                <button
                  key={d}
                  className="py-4 bg-white border border-gray-300 hover:bg-purple-50 active:bg-purple-100 rounded-lg text-2xl font-semibold text-gray-800 transition"
                  onClick={() => handleDigitInput(d)}
                >
                  {d}
                </button>
              ))}
              <button
                className="py-4 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition"
                onClick={handleBackspace}
              >
                지우기
              </button>
              <button
                className="py-4 bg-white border border-gray-300 hover:bg-purple-50 active:bg-purple-100 rounded-lg text-2xl font-semibold text-gray-800 transition"
                onClick={() => handleDigitInput(0)}
              >
                0
              </button>
              <div />
            </div>
          )}
        </div>
      )}

      {status === "result" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-purple-900 mb-6">검사 결과</h2>
          <div className="space-y-4 divide-y divide-gray-100">
            <div className="pb-4">
              <p className="text-gray-600 mb-1">최고 자릿수 (Digit Span)</p>
              <p className="text-3xl font-bold text-purple-600">
                {bestLength}자리
              </p>
            </div>
            <div className="pt-4">
              <p className="text-gray-600 mb-1">총 시도</p>
              <p className="text-2xl font-semibold text-gray-700">{trialCount}회</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            성인 평균은 약 7±2자리입니다. 결과는 컨디션, 주의 집중도에 따라 변할 수 있으며 진단 도구가 아닙니다.
          </p>
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
