"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import BarTimer from "./BarTimer";

const colors = ["빨강", "초록", "파랑", "노랑"];
const buttonColors = [
  "bg-red-500 hover:bg-red-600",
  "bg-green-500 hover:bg-green-600",
  "bg-blue-500 hover:bg-blue-600",
  "bg-yellow-500 hover:bg-yellow-600",
];
const wordColors = [
  "text-red-500",
  "text-green-500",
  "text-blue-500",
  "text-yellow-500",
];

export default function StroopTest() {
  const startTime = useRef<number>(0);
  const totalTime = useRef<number>(0);
  const meanTime = useRef<number>(0);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [currentColor, setCurrentColor] = useState("");
  const [currentWord, setCurrentWord] = useState("");
  const [currentWordColor, setCurrentWordColor] = useState("");
  const [status, setStatus] = useState<"ready" | "test" | "result">("ready");
  const [graphKey, setGraphKey] = useState<number>(0);

  const generateRandomColor = useCallback(() => {
    const colorRandomIndex = Math.floor(Math.random() * colors.length);
    const wordRandomIndex = Math.floor(Math.random() * colors.length);
    setCurrentColor(colors[colorRandomIndex]);
    setCurrentWordColor(wordColors[colorRandomIndex]);
    setCurrentWord(colors[wordRandomIndex]);
  }, []);

  const handleStart = useCallback(() => {
    setStatus("test");
    startTime.current = Date.now();
  }, []);

  const handleTimeout = useCallback(() => {
    if (!done) totalTime.current += 1000;
    if (totalQuestions + 1 < 20) {
      setDone(false);
      setGraphKey((prevKey) => prevKey + 1);
      generateRandomColor();
      setTotalQuestions((prevQuestion) => prevQuestion + 1);
      startTime.current = Date.now();
    } else {
      setDone(false);
      meanTime.current = +(totalTime.current / 20).toFixed(0);
      alert("검사가 끝났습니다.");
      setStatus("result");
    }
  }, [done, generateRandomColor, totalQuestions]);

  useEffect(() => {
    generateRandomColor();
  }, [generateRandomColor]);

  const handleClick = (chosenColor: string) => {
    if (chosenColor === currentColor && totalQuestions + 1 < 20 && !done) {
      setDone(true);
      setScore(score + 1);
      totalTime.current += Date.now() - startTime.current;
    }
  };

  const resetTest = () => {
    setScore(0);
    setTotalQuestions(0);
    totalTime.current = 0;
    meanTime.current = 0;
    setStatus("ready");
    generateRandomColor();
  };

  return (
    <div className="mx-auto max-w-2xl">
      {status === "ready" && (
        <div>
          <h1 className="text-3xl font-bold text-purple-900 mb-6">스트룹 검사</h1>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">테스트 방법</h3>
            <p className="mb-3 font-medium text-gray-800">
              스트룹 테스트로 당신의 집중력과 반응속도를 테스트해보세요!
            </p>
            <p className="text-sm mb-3 text-purple-700">
              테스트가 시작되면 글자의 <strong>색깔</strong>을 눌러주세요 (글에 써있는 색깔을 누르면 안됩니다)
            </p>
            <div className="w-full text-center text-red-500 text-4xl font-bold my-4">
              초록
            </div>
            <p className="text-sm mb-3 text-gray-600">
              예를 들어 위의 글자의 경우는 <strong>빨강</strong>을 눌러야 합니다
            </p>
            <p className="text-sm mb-4 font-medium text-purple-700">
              정답은 1초 안에 눌러야 하며, 20문항을 풀게 됩니다
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
            문항 번호: {totalQuestions + 1} / 20
          </h1>
          <div className="flex justify-center mb-8">
            <BarTimer
              key={graphKey}
              hideBar={false}
              maxTime={1000}
              maxWidth={300}
              handleTimeout={handleTimeout}
            />
          </div>
          <div className="flex justify-center mb-10">
            <p className={`${currentWordColor} text-5xl font-bold`}>
              {currentWord}
            </p>
          </div>
          <div className="flex justify-center gap-3">
            {buttonColors.map((buttonColor, index) => (
              <button
                key={index}
                className={`${buttonColor} text-white py-3 px-5 rounded-lg font-medium transition`}
                onClick={() => handleClick(colors[index])}
              >
                {colors[index]}
              </button>
            ))}
          </div>
        </div>
      )}
      {status === "result" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-purple-900 mb-6">검사 결과</h2>
          <div className="space-y-4 divide-y divide-gray-100">
            <div className="pb-4">
              <p className="text-gray-600 mb-1">정답 수</p>
              <p className="text-3xl font-bold text-purple-600">{score} / 20</p>
            </div>
            <div className="pt-4 pb-4">
              <p className="text-gray-600 mb-1">평균 반응 속도</p>
              <p className="text-3xl font-bold text-purple-600">{meanTime.current} ms</p>
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
