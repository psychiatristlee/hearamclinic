"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import QuestionItem from "./QuestionItem";
import WarningModal from "./WarningModal";
import { GroupedResult, Question, Questionnaire } from "@/lib/test/types";
import { arrayToQueryString } from "@/lib/test/utils";

interface QuestionnaireFormProps {
  questionnaire: Questionnaire;
}

export default function QuestionnaireForm({ questionnaire }: QuestionnaireFormProps) {
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);

  const [questions, setQuestions] = useState<Array<Question>>(
    questionnaire.questions
  );

  const [unAnsweredQuestions, setUnAnsweredQuestions] = useState<Array<Question>>([]);

  const handleQuestionChange = (
    index: number,
    itemIndex: number,
    itemValue: number
  ) => {
    const newQuestions: Array<Question> = [...questions];
    newQuestions[index].currentItemIndex = itemIndex;
    newQuestions[index].currentValue = itemValue;
    setQuestions(newQuestions);
    scrollToElement("question" + index.toString());
  };

  const scrollToElement = (elementId: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();
    const unAnsweredQuestion = questions.filter((question) => {
      if (question.currentValue === null) return question;
    });

    if (unAnsweredQuestion.length !== 0) {
      setShowWarning(true);
      setUnAnsweredQuestions(unAnsweredQuestion);
      window.scroll(0, 0);
    } else {
      const groupedResults = getGroupedResults(questions);
      const resultToQueryString: string = arrayToQueryString(groupedResults);
      const currentTimeStamp = new Date().getTime();
      router.push(
        "/test/result/" +
          questionnaire.name +
          resultToQueryString +
          "&timeStamp=" +
          currentTimeStamp
      );
    }
  };

  const getGroupedResults = (questions: Array<Question>): GroupedResult[] =>
    questions.reduce<Array<GroupedResult>>((accumulator, currentQuestion) => {
      const { group, currentValue } = currentQuestion;
      const existingGroup = accumulator.find((item) => item.group === group);

      if (existingGroup) {
        currentValue && (existingGroup.sum += currentValue);
      } else {
        accumulator.push({ group, sum: currentValue || 0 });
      }

      return accumulator;
    }, []);

  return (
    <>
      <WarningModal isOpen={showWarning} onClose={() => setShowWarning(false)} />
      {questions.map((question, index) => (
        <div key={index} id={"question" + index.toString()}>
          <QuestionItem
            questions={questions}
            unAnsweredQuestions={unAnsweredQuestions}
            question={question}
            answers={question.answers}
            handleQuestionChange={handleQuestionChange}
          />
        </div>
      ))}
      <div className="flex justify-center pt-4 pb-2">
        <button
          className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          onClick={handleSubmit}
        >
          제출하기
        </button>
      </div>
    </>
  );
}
