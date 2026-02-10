"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import BarTimer from "./BarTimer";
import Image from "next/image";
import { generateRandomList } from "@/lib/test/utils";

const animals = [
  { name: "cat", koreanName: "고양이", image: "/images/test/selective-attention/cat.png" },
  { name: "dog", koreanName: "강아지", image: "/images/test/selective-attention/dog.png" },
  { name: "chicken", koreanName: "닭", image: "/images/test/selective-attention/chicken.png" },
  { name: "rabbit", koreanName: "토끼", image: "/images/test/selective-attention/rabbit.png" },
];
const testTime = 1000;
const testAreaWidth = 300;
const totalCount = 100;

export default function SelectiveAttentionTest() {
  const startTime = useRef<number>(0);
  const totalTime = useRef<number>(0);
  const totalErrorTime = useRef<number>(0);
  const meanTime = useRef<number>(0);

  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const [errorScore, setErrorScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [answerAnimal, setAnswerAnimal] = useState<{
    name: string;
    koreanName: string;
    image: string;
  }>();
  const [randomList, setRandomList] = useState<number[]>(
    generateRandomList(totalCount)
  );
  const [status, setStatus] = useState<"ready" | "test" | "result">("ready");
  const [graphKey, setGraphKey] = useState<number>(100);
  const [imageKey, setImageKey] = useState<number>(200);

  const handleStart = useCallback(() => {
    setStatus("test");
    startTime.current = Date.now();
  }, []);

  const handleTimeout = useCallback(() => {
    if (totalQuestions + 1 <= randomList.length) {
      setDone(false);
      setGraphKey((prevKey) => prevKey + 1);
      setImageKey((prevKey) => prevKey + 1);
      if (animals[randomList[totalQuestions]].name === answerAnimal?.name) {
        setErrorScore((errorScore) => errorScore + 1);
        totalTime.current += Date.now() - startTime.current;
      }
      setTotalQuestions((prevQuestion) => prevQuestion + 1);
      startTime.current = Date.now();
    } else {
      setDone(false);
      meanTime.current = score === 0 ? 1000 : +(totalTime.current / score).toFixed(0);
      alert("검사가 끝났습니다.");
      setStatus("result");
    }
  }, [answerAnimal?.name, randomList, totalQuestions, score]);

  useEffect(() => {
    setAnswerAnimal(animals[Math.floor(Math.random() * animals.length)]);
  }, []);

  const handleClick = () => {
    if (
      animals[randomList[totalQuestions]].name === answerAnimal?.name &&
      totalQuestions + 1 < randomList.length &&
      !done
    ) {
      setDone(true);
      setScore((score) => score + 1);
      totalTime.current += Date.now() - startTime.current;
    } else if (
      animals[randomList[totalQuestions]].name !== answerAnimal?.name &&
      totalQuestions + 1 < randomList.length &&
      !done
    ) {
      setDone(true);
      setErrorScore((errorScore) => errorScore + 1);
      totalErrorTime.current += Date.now() - startTime.current;
    }
  };

  const resetTest = () => {
    setScore(0);
    setErrorScore(0);
    setTotalQuestions(0);
    totalTime.current = 0;
    totalErrorTime.current = 0;
    meanTime.current = 0;
    setStatus("ready");
    setRandomList(generateRandomList(totalCount));
    setAnswerAnimal(animals[Math.floor(Math.random() * animals.length)]);
  };

  return (
    <div className="max-w-2xl mx-auto">
      {status === "ready" && (
        <div>
          <h1 className="text-3xl font-bold text-purple-900 mb-6">
            선택 주의력(Selective Attention) 검사
          </h1>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">테스트 방법</h3>
            <p className="mb-3 font-medium text-gray-800">
              올바른 대상을 선택할 수 있는 능력을 평가하는 선택주의력검사입니다
            </p>
            <p className="text-sm mb-3 text-purple-700">
              테스트가 시작되면 그림이 <strong>{answerAnimal?.koreanName}</strong>일 때만
              선택버튼을 눌러주세요 ({answerAnimal?.koreanName}가(이) 아닌 동물일 때는 선택하면 안됩니다!)
            </p>
            <p className="text-sm mb-3 text-gray-600">
              그림은 순식간에 사라지므로 꼭 집중해서 봐주세요
            </p>
            <p className="text-sm mb-4 font-medium text-purple-700">
              정답은 1초 안에 눌러야 하며, {totalCount}문항을 풀게 됩니다
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
        <>
          <BarTimer
            key={graphKey}
            hideBar={true}
            maxTime={testTime}
            maxWidth={testAreaWidth}
            handleTimeout={handleTimeout}
          />
          {animals[randomList[totalQuestions]] && (
            <div className="w-full">
              <h1 className="text-purple-900 text-2xl font-bold mb-4">
                문항 번호: {totalQuestions + 1} / {totalCount}
              </h1>
              <div className="mx-auto" style={{ width: 300 }}>
                <div key={imageKey} className="animate-[fadeOut_1s_ease-in_forwards]">
                  <Image
                    src={animals[randomList[totalQuestions]].image}
                    width={testAreaWidth}
                    height={300}
                    alt="Animal"
                  />
                </div>
                <button
                  className="w-full mt-2 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
                  onClick={() => handleClick()}
                >
                  선택
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {status === "result" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-purple-900 mb-6">검사 결과</h2>
          <div className="space-y-4 divide-y divide-gray-100">
            <div className="pb-4">
              <p className="text-gray-600 mb-1">정답을 고른 개수</p>
              <p className="text-3xl font-bold text-purple-600">{score}개</p>
            </div>
            <div className="pt-4 pb-4">
              <p className="text-gray-600 mb-1">잘못 선택한 개수</p>
              <p className="text-3xl font-bold text-red-500">{errorScore}개</p>
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
