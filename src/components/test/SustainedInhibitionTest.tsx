"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import BarTimer from "./BarTimer";

const GO_COLOR = "파란색";
const NO_GO_COLOR = "빨간색";
const TOTAL_TRIALS = 60;
const GO_RATIO = 0.7;
const STIMULUS_DURATION = 1500;

export default function SustainedInhibitionTest() {
  const startTime = useRef<number>(0);
  const totalReactionTime = useRef<number>(0);
  const meanReactionTime = useRef<number>(0);

  const [done, setDone] = useState(false);
  const [correctGo, setCorrectGo] = useState(0);
  const [correctNoGo, setCorrectNoGo] = useState(0);
  const [commissionErrors, setCommissionErrors] = useState(0);
  const [omissionErrors, setOmissionErrors] = useState(0);
  const [totalTrials, setTotalTrials] = useState(0);
  const [currentStimulus, setCurrentStimulus] = useState<"go" | "nogo" | null>(null);
  const [status, setStatus] = useState<"ready" | "test" | "result">("ready");
  const [graphKey, setGraphKey] = useState<number>(0);
  const [trialSequence, setTrialSequence] = useState<("go" | "nogo")[]>([]);

  const [resultValues, setResultValues] = useState<{
    correctGo: number;
    correctNoGo: number;
    commissionErrors: number;
    omissionErrors: number;
    meanReactionTime: number;
    accuracy: number;
  }>();

  const generateTrialSequence = useCallback(() => {
    const sequence: ("go" | "nogo")[] = [];
    const goCount = Math.floor(TOTAL_TRIALS * GO_RATIO);
    const noGoCount = TOTAL_TRIALS - goCount;

    for (let i = 0; i < goCount; i++) sequence.push("go");
    for (let i = 0; i < noGoCount; i++) sequence.push("nogo");

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
    setCurrentStimulus(trialSequence[0]);
    startTime.current = Date.now();
  }, [trialSequence]);

  const handleTimeout = useCallback(() => {
    if (currentStimulus === "go" && !done) {
      setOmissionErrors((prev) => prev + 1);
    } else if (currentStimulus === "nogo" && !done) {
      setCorrectNoGo((prev) => prev + 1);
    }

    if (totalTrials + 1 < TOTAL_TRIALS) {
      setDone(false);
      setGraphKey((prevKey) => prevKey + 1);
      setTotalTrials((prev) => prev + 1);
      setCurrentStimulus(trialSequence[totalTrials + 1]);
      startTime.current = Date.now();
    } else {
      setDone(false);
      alert("검사가 끝났습니다.");
      const accuracy = ((correctGo + correctNoGo) / TOTAL_TRIALS) * 100;
      meanReactionTime.current = correctGo > 0
        ? Math.floor(totalReactionTime.current / correctGo)
        : 0;
      setResultValues({
        correctGo,
        correctNoGo,
        commissionErrors,
        omissionErrors,
        meanReactionTime: meanReactionTime.current,
        accuracy: Math.round(accuracy * 100) / 100,
      });
      setStatus("result");
    }
  }, [currentStimulus, done, totalTrials, trialSequence, correctGo, correctNoGo, commissionErrors, omissionErrors]);

  const handleClick = useCallback(() => {
    if (done || totalTrials >= TOTAL_TRIALS) return;

    const reactionTime = Date.now() - startTime.current;

    if (currentStimulus === "go") {
      setDone(true);
      setCorrectGo((prev) => prev + 1);
      totalReactionTime.current += reactionTime;
    } else if (currentStimulus === "nogo") {
      setDone(true);
      setCommissionErrors((prev) => prev + 1);
    }
  }, [currentStimulus, done, totalTrials]);

  useEffect(() => {
    if (status === "test" && done && totalTrials < TOTAL_TRIALS) {
      const timer = setTimeout(() => {
        setDone(false);
        setGraphKey((prevKey) => prevKey + 1);
        setTotalTrials((prev) => prev + 1);
        if (totalTrials + 1 < TOTAL_TRIALS) {
          setCurrentStimulus(trialSequence[totalTrials + 1]);
          startTime.current = Date.now();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [done, totalTrials, status, trialSequence]);

  const resetTest = () => {
    setCorrectGo(0);
    setCorrectNoGo(0);
    setCommissionErrors(0);
    setOmissionErrors(0);
    setTotalTrials(0);
    meanReactionTime.current = 0;
    totalReactionTime.current = 0;
    setStatus("ready");
    setTrialSequence(generateTrialSequence());
  };

  return (
    <div className="mx-auto max-w-2xl">
      {status === "ready" && (
        <div>
          <h1 className="text-3xl font-bold text-purple-900 mb-6">억제지속 주의력 검사</h1>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">테스트 방법</h3>
            <p className="mb-3 font-medium text-gray-800">
              억제지속 주의력 검사로 당신의 주의력과 억제 능력을 테스트해보세요!
            </p>
            <p className="text-sm mb-2 text-blue-600">
              <strong>파란색 원</strong>이 나타나면 <strong>클릭</strong>하세요 (Go)
            </p>
            <p className="text-sm mb-3 text-red-600">
              <strong>빨간색 원</strong>이 나타나면 <strong>클릭하지 마세요</strong> (No-Go)
            </p>
            <p className="text-sm mb-4 font-medium text-purple-700">
              총 {TOTAL_TRIALS}개의 시행이 있으며, 각 자극은 1.5초 동안 표시됩니다
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
      {status === "test" && (
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
          <div className="flex justify-center mb-8">
            <div
              className={`w-64 h-64 rounded-full flex items-center justify-center text-white text-2xl font-bold cursor-pointer transition-all ${
                currentStimulus === "go"
                  ? "bg-blue-500 hover:bg-blue-600"
                  : "bg-red-500 hover:bg-red-600"
              } ${done ? "opacity-50" : ""}`}
              onClick={handleClick}
            >
              {currentStimulus === "go" ? GO_COLOR : NO_GO_COLOR}
            </div>
          </div>
          <div className="text-center text-sm text-gray-600">
            {currentStimulus === "go"
              ? "파란색 원을 클릭하세요!"
              : "빨간색 원은 클릭하지 마세요!"}
          </div>
        </div>
      )}
      {status === "result" && resultValues && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-purple-900 mb-6">검사 결과</h2>
          <div className="border-b border-gray-100 pb-4 mb-4">
            <p className="text-gray-600 mb-1">정확도</p>
            <p className="text-3xl font-bold text-green-600">{resultValues.accuracy}%</p>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-xl">
              <p className="text-sm text-gray-600">정확한 Go 반응</p>
              <p className="text-2xl font-bold text-blue-600">{resultValues.correctGo}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-xl">
              <p className="text-sm text-gray-600">정확한 No-Go 억제</p>
              <p className="text-2xl font-bold text-green-600">{resultValues.correctNoGo}</p>
            </div>
            <div className="bg-red-50 p-4 rounded-xl">
              <p className="text-sm text-gray-600">오반응 (Commission)</p>
              <p className="text-2xl font-bold text-red-600">{resultValues.commissionErrors}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-xl">
              <p className="text-sm text-gray-600">누락 (Omission)</p>
              <p className="text-2xl font-bold text-orange-600">{resultValues.omissionErrors}</p>
            </div>
          </div>
          {resultValues.meanReactionTime > 0 && (
            <div className="border-t border-gray-100 pt-4 mb-4">
              <p className="text-sm text-gray-600">평균 반응 시간</p>
              <p className="text-2xl font-bold text-purple-600">{resultValues.meanReactionTime}ms</p>
            </div>
          )}
          <button
            className="w-full mt-4 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
            onClick={resetTest}
          >
            다시 테스트하기
          </button>
        </div>
      )}
    </div>
  );
}
