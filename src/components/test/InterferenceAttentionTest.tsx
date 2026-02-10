"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import BarTimer from "./BarTimer";

const ARROWS = { LEFT: "\u2190", RIGHT: "\u2192" } as const;
const TOTAL_TRIALS = 60;
const STIMULUS_DURATION = 2000;
const CONGRUENT_RATIO = 0.5;

type ArrowDirection = "left" | "right";

interface Trial {
  type: "congruent" | "incongruent";
  target: ArrowDirection;
  flankers: ArrowDirection[];
}

export default function InterferenceAttentionTest() {
  const startTime = useRef<number>(0);
  const totalReactionTime = useRef<number>(0);
  const congruentReactionTime = useRef<number>(0);
  const incongruentReactionTime = useRef<number>(0);

  const [done, setDone] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [errors, setErrors] = useState(0);
  const [congruentCorrect, setCongruentCorrect] = useState(0);
  const [incongruentCorrect, setIncongruentCorrect] = useState(0);
  const [congruentErrors, setCongruentErrors] = useState(0);
  const [incongruentErrors, setIncongruentErrors] = useState(0);
  const [totalTrials, setTotalTrials] = useState(0);
  const [currentTrial, setCurrentTrial] = useState<Trial | null>(null);
  const [status, setStatus] = useState<"ready" | "test" | "result">("ready");
  const [graphKey, setGraphKey] = useState<number>(0);
  const [trialSequence, setTrialSequence] = useState<Trial[]>([]);

  const [resultValues, setResultValues] = useState<{
    correct: number;
    errors: number;
    accuracy: number;
    meanReactionTime: number;
    congruentAccuracy: number;
    incongruentAccuracy: number;
    meanCongruentTime: number;
    meanIncongruentTime: number;
    interferenceEffect: number;
  }>();

  const generateTrialSequence = useCallback(() => {
    const sequence: Trial[] = [];
    const congruentCount = Math.floor(TOTAL_TRIALS * CONGRUENT_RATIO);
    const incongruentCount = TOTAL_TRIALS - congruentCount;

    for (let i = 0; i < congruentCount; i++) {
      const direction: ArrowDirection = Math.random() > 0.5 ? "left" : "right";
      sequence.push({
        type: "congruent",
        target: direction,
        flankers: [direction, direction, direction, direction],
      });
    }

    for (let i = 0; i < incongruentCount; i++) {
      const targetDirection: ArrowDirection = Math.random() > 0.5 ? "left" : "right";
      const flankerDirection: ArrowDirection = targetDirection === "left" ? "right" : "left";
      sequence.push({
        type: "incongruent",
        target: targetDirection,
        flankers: [flankerDirection, flankerDirection, flankerDirection, flankerDirection],
      });
    }

    for (let i = sequence.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [sequence[i], sequence[j]] = [sequence[j], sequence[i]];
    }
    return sequence;
  }, []);

  useEffect(() => {
    if (status === "ready") {
      setTrialSequence(generateTrialSequence());
    }
  }, [status, generateTrialSequence]);

  const handleStart = useCallback(() => {
    setStatus("test");
    setTotalTrials(0);
    setCurrentTrial(trialSequence[0]);
    startTime.current = Date.now();
  }, [trialSequence]);

  const handleTimeout = useCallback(() => {
    if (!done && currentTrial) {
      setErrors((prev) => prev + 1);
      if (currentTrial.type === "congruent") {
        setCongruentErrors((prev) => prev + 1);
      } else {
        setIncongruentErrors((prev) => prev + 1);
      }
    }

    if (totalTrials + 1 < TOTAL_TRIALS) {
      setDone(false);
      setGraphKey((prevKey) => prevKey + 1);
      setTotalTrials((prev) => prev + 1);
      setCurrentTrial(trialSequence[totalTrials + 1]);
      startTime.current = Date.now();
    } else {
      setDone(false);
      alert("검사가 끝났습니다.");

      const accuracy = (correct / TOTAL_TRIALS) * 100;
      const congruentTrials = Math.floor(TOTAL_TRIALS * CONGRUENT_RATIO);
      const incongruentTrials = TOTAL_TRIALS - congruentTrials;
      const congruentAcc = (congruentCorrect / congruentTrials) * 100;
      const incongruentAcc = (incongruentCorrect / incongruentTrials) * 100;
      const meanRT = correct > 0 ? Math.floor(totalReactionTime.current / correct) : 0;
      const meanCT = congruentCorrect > 0 ? Math.floor(congruentReactionTime.current / congruentCorrect) : 0;
      const meanIT = incongruentCorrect > 0 ? Math.floor(incongruentReactionTime.current / incongruentCorrect) : 0;

      setResultValues({
        correct,
        errors,
        accuracy: Math.round(accuracy * 100) / 100,
        meanReactionTime: meanRT,
        congruentAccuracy: Math.round(congruentAcc * 100) / 100,
        incongruentAccuracy: Math.round(incongruentAcc * 100) / 100,
        meanCongruentTime: meanCT,
        meanIncongruentTime: meanIT,
        interferenceEffect: meanIT - meanCT,
      });
      setStatus("result");
    }
  }, [currentTrial, done, totalTrials, trialSequence, correct, errors, congruentCorrect, incongruentCorrect]);

  const handleClick = useCallback(
    (direction: ArrowDirection) => {
      if (done || !currentTrial || totalTrials >= TOTAL_TRIALS) return;

      const reactionTime = Date.now() - startTime.current;

      if (direction === currentTrial.target) {
        setDone(true);
        setCorrect((prev) => prev + 1);
        totalReactionTime.current += reactionTime;

        if (currentTrial.type === "congruent") {
          setCongruentCorrect((prev) => prev + 1);
          congruentReactionTime.current += reactionTime;
        } else {
          setIncongruentCorrect((prev) => prev + 1);
          incongruentReactionTime.current += reactionTime;
        }
      } else {
        setDone(true);
        setErrors((prev) => prev + 1);
        if (currentTrial.type === "congruent") {
          setCongruentErrors((prev) => prev + 1);
        } else {
          setIncongruentErrors((prev) => prev + 1);
        }
      }
    },
    [currentTrial, done, totalTrials]
  );

  useEffect(() => {
    if (status === "test" && done && totalTrials < TOTAL_TRIALS) {
      const timer = setTimeout(() => {
        setDone(false);
        setGraphKey((prevKey) => prevKey + 1);
        setTotalTrials((prev) => prev + 1);
        if (totalTrials + 1 < TOTAL_TRIALS) {
          setCurrentTrial(trialSequence[totalTrials + 1]);
          startTime.current = Date.now();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [done, totalTrials, status, trialSequence]);

  const resetTest = () => {
    setCorrect(0);
    setErrors(0);
    setCongruentCorrect(0);
    setIncongruentCorrect(0);
    setCongruentErrors(0);
    setIncongruentErrors(0);
    setTotalTrials(0);
    totalReactionTime.current = 0;
    congruentReactionTime.current = 0;
    incongruentReactionTime.current = 0;
    setStatus("ready");
    setTrialSequence(generateTrialSequence());
  };

  const getArrow = (direction: ArrowDirection) => {
    return direction === "left" ? ARROWS.LEFT : ARROWS.RIGHT;
  };

  return (
    <div className="mx-auto max-w-2xl">
      {status === "ready" && (
        <div>
          <h1 className="text-3xl font-bold text-purple-900 mb-6">간섭선택 주의력 검사</h1>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">테스트 방법</h3>
            <p className="mb-3 font-medium text-gray-800">
              간섭선택 주의력 검사로 당신의 주의력과 간섭 억제 능력을 테스트해보세요!
            </p>
            <p className="text-sm mb-2 text-purple-700">
              <strong>중앙의 화살표</strong> 방향에 따라 반응하세요
            </p>
            <p className="text-sm mb-2 text-gray-600">
              <strong>{ARROWS.LEFT}</strong> 왼쪽 화살표면 왼쪽 버튼 클릭
            </p>
            <p className="text-sm mb-3 text-gray-600">
              <strong>{ARROWS.RIGHT}</strong> 오른쪽 화살표면 오른쪽 버튼 클릭
            </p>
            <p className="text-sm mb-4 font-medium text-purple-700">
              양쪽의 간섭 화살표는 무시하고 중앙 화살표만 보세요!
            </p>
            <p className="text-sm mb-4 font-medium text-gray-600">
              총 {TOTAL_TRIALS}개의 시행이 있으며, 각 자극은 2초 동안 표시됩니다
            </p>
            <div className="flex justify-center">
              <button
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
                onClick={handleStart}
              >
                테스트 시작
              </button>
            </div>
          </div>
        </div>
      )}
      {status === "test" && currentTrial && (
        <div>
          <h1 className="text-purple-900 text-2xl font-bold mb-8 mt-4">
            시행: {totalTrials + 1} / {TOTAL_TRIALS}
          </h1>
          <div className="flex justify-center mb-8">
            <BarTimer
              key={graphKey}
              hideBar={false}
              maxTime={STIMULUS_DURATION}
              maxWidth={300}
              handleTimeout={handleTimeout}
            />
          </div>
          <div className="flex items-center justify-center space-x-2 text-6xl font-bold mb-8">
            <span className="text-gray-400">{getArrow(currentTrial.flankers[0])}</span>
            <span className="text-gray-400">{getArrow(currentTrial.flankers[1])}</span>
            <span className="text-purple-600">{getArrow(currentTrial.target)}</span>
            <span className="text-gray-400">{getArrow(currentTrial.flankers[2])}</span>
            <span className="text-gray-400">{getArrow(currentTrial.flankers[3])}</span>
          </div>
          <div className="flex justify-center gap-6">
            <button
              className={`px-8 py-4 text-2xl font-bold rounded-xl transition-all ${
                done
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 text-white hover:scale-105"
              }`}
              onClick={() => handleClick("left")}
              disabled={done}
            >
              {ARROWS.LEFT} 왼쪽
            </button>
            <button
              className={`px-8 py-4 text-2xl font-bold rounded-xl transition-all ${
                done
                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700 text-white hover:scale-105"
              }`}
              onClick={() => handleClick("right")}
              disabled={done}
            >
              오른쪽 {ARROWS.RIGHT}
            </button>
          </div>
        </div>
      )}
      {status === "result" && resultValues && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-purple-900 mb-6">검사 결과</h2>
          <div className="border-b border-gray-100 pb-4 mb-4">
            <p className="text-gray-600 mb-1">전체 정확도</p>
            <p className="text-3xl font-bold text-green-600">{resultValues.accuracy}%</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-xl">
              <p className="text-sm text-gray-600">정답</p>
              <p className="text-2xl font-bold text-blue-600">{resultValues.correct}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl">
              <p className="text-sm text-gray-600">오답</p>
              <p className="text-2xl font-bold text-red-600">{resultValues.errors}</p>
            </div>
          </div>
          {resultValues.meanReactionTime > 0 && (
            <div className="border-t border-gray-100 pt-4 mb-4">
              <p className="text-sm text-gray-600 mb-1">평균 반응 시간</p>
              <p className="text-2xl font-bold text-purple-600">{resultValues.meanReactionTime}ms</p>
            </div>
          )}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <p className="font-semibold text-gray-900">조건별 결과</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-green-50 p-3 rounded-xl">
                <p className="text-xs text-gray-600">일치 조건 정확도</p>
                <p className="text-xl font-bold text-green-600">{resultValues.congruentAccuracy}%</p>
                <p className="text-xs text-gray-500">{resultValues.meanCongruentTime}ms</p>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl">
                <p className="text-xs text-gray-600">불일치 조건 정확도</p>
                <p className="text-xl font-bold text-orange-600">{resultValues.incongruentAccuracy}%</p>
                <p className="text-xs text-gray-500">{resultValues.meanIncongruentTime}ms</p>
              </div>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl">
              <p className="text-xs text-gray-600">간섭 효과</p>
              <p className="text-xl font-bold text-purple-600">
                {resultValues.interferenceEffect > 0 ? "+" : ""}
                {resultValues.interferenceEffect}ms
              </p>
              <p className="text-xs text-gray-500">(불일치 - 일치 반응시간 차이)</p>
            </div>
          </div>
          <button
            className="w-full mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
            onClick={resetTest}
          >
            다시 테스트하기
          </button>
        </div>
      )}
    </div>
  );
}
