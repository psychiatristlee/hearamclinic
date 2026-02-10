"use client";

import { Question, Answer } from "@/lib/test/types";

interface QuestionItemProps {
  questions: Array<Question>;
  unAnsweredQuestions: Array<Question>;
  question: Question;
  answers: Answer[];
  handleQuestionChange: (index: number, itemIndex: number, itemValue: number) => void;
}

export default function QuestionItem({
  questions,
  unAnsweredQuestions,
  question,
  answers,
  handleQuestionChange,
}: QuestionItemProps) {
  const isUnanswered = unAnsweredQuestions.includes(question);

  return (
    <div className="py-4">
      <h3
        className={`text-base font-semibold mb-3 ${
          isUnanswered ? "text-red-500" : "text-gray-900"
        }`}
      >
        {question.index + 1}. {question.description}
      </h3>
      <div className="flex flex-col gap-1.5">
        {answers.map((questionItemAnswer, index) => (
          <label
            key={index}
            className={`inline-flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition ${
              questions[question.index].currentItemIndex === questionItemAnswer.index
                ? "bg-purple-50 border border-purple-200"
                : "hover:bg-gray-50 border border-transparent"
            }`}
          >
            <input
              className="h-4 w-4 accent-purple-600"
              type="radio"
              name={question.group + question.index.toString()}
              value={questionItemAnswer.index}
              onChange={() =>
                handleQuestionChange(
                  question.index,
                  questionItemAnswer.index,
                  questionItemAnswer.value
                )
              }
              checked={
                questions[question.index].currentItemIndex ===
                questionItemAnswer.index
              }
            />
            <span className="text-sm text-gray-700">
              {questionItemAnswer.answer}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
