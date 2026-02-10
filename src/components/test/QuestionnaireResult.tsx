"use client";

import { CutOff, Questionnaire } from "@/lib/test/types";
import Image from "next/image";
import GradientCircleChart from "./GradientCircleChart";
import { useState, useEffect } from "react";

interface QuestionnaireResultProps {
  questionnaire: Questionnaire;
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function QuestionnaireResult({
  questionnaire,
  searchParams,
}: QuestionnaireResultProps) {
  const [groups, setGroups] = useState<{ id: string; value: string }[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let groups: { id: string; value: string }[];
    if (typeof searchParams.sum === "string") {
      groups = [{ id: questionnaire.groups[0].id, value: searchParams.sum }];
    } else if (
      typeof searchParams.sum !== "string" &&
      searchParams.sum !== undefined &&
      searchParams.sum.length !== 0
    ) {
      groups = questionnaire.groups.map((group, index) => ({
        id: group.id,
        value: searchParams.sum![index],
      }));
    } else {
      groups = [];
    }

    if (typeof searchParams.timeStamp === "string") {
      setGroups(groups);
      setIsLoading(false);
    }
  }, [questionnaire.groups, searchParams.sum, searchParams.timeStamp]);

  const getResultAndMaxValue = (
    cutOffs: CutOff[],
    inputValue: number
  ): {
    maxValue: number;
    result: string;
    description: string;
    color: string;
  } => {
    const sortedCutOffs = cutOffs.sort((a, b) => a.end - b.end);
    const foundCutoff = sortedCutOffs.find(
      (range) => inputValue <= range.end
    );
    const maxValue = sortedCutOffs[sortedCutOffs.length - 1].end;

    if (foundCutoff) {
      return {
        maxValue,
        result: foundCutoff.result,
        description: foundCutoff.description,
        color: foundCutoff.severityColor,
      };
    } else {
      return {
        maxValue,
        result: "결과가 존재하지 않습니다",
        description: "정상 참고치가 존재하지 않습니다",
        color: "#000000",
      };
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="mb-4">
        <Image
          src={questionnaire.image}
          width={500}
          height={500}
          alt="Header Photo"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-purple-900 mb-4">
          {questionnaire.title} 결과
        </h1>
        <ul className="divide-y divide-gray-200">
          {questionnaire?.groups.map((group, index) => {
            if (!isLoading) {
              const { maxValue, result, description, color } =
                getResultAndMaxValue(group.cutOffs, +groups[index].value);

              return (
                <li key={index}>
                  <div className="flex-col my-6">
                    <h3 className="text-center font-bold text-lg text-gray-900">
                      검사항목 {index + 1}: {group.title}
                    </h3>
                    <GradientCircleChart
                      value={+groups[index].value}
                      maxValue={+maxValue}
                      result={result}
                      color={color}
                    />
                    <p className="text-base text-center text-gray-700">
                      {description}
                    </p>
                  </div>
                </li>
              );
            } else {
              return (
                <li
                  className="bg-gray-100 p-40 my-4 animate-pulse rounded-xl"
                  key={index}
                ></li>
              );
            }
          })}
        </ul>
      </div>
    </div>
  );
}
