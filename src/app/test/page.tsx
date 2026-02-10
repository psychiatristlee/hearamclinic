import { Metadata } from "next";
import questionnaires from "@/lib/test/questionnaires";
import Link from "next/link";

export const metadata: Metadata = {
  title: "심리검사 목록",
  description:
    "무료 온라인 심리검사를 통해 자신의 상태를 확인해보세요. 우울증, 불안, ADHD, 양극성 장애, 알코올 사용 장애, 스트레스 등 다양한 심리검사를 제공합니다.",
};

const attentionTests = [
  {
    name: "stroop",
    title: "스트룹 검사 (Stroop Test)",
    description: "글자의 색깔과 내용이 다를 때 올바른 색깔을 선택하여 집중력과 반응속도를 측정합니다.",
  },
  {
    name: "selective-attention",
    title: "선택 주의력 검사 (Selective Attention)",
    description: "빠르게 변하는 자극 중에서 목표 대상만 정확하게 선택하는 능력을 평가합니다.",
  },
  {
    name: "sustained-inhibition",
    title: "억제지속 주의력 검사 (Go/No-Go)",
    description: "반응해야 할 자극과 억제해야 할 자극을 구분하여 주의력과 억제 능력을 측정합니다.",
  },
  {
    name: "interference-attention",
    title: "간섭선택 주의력 검사 (Flanker Test)",
    description: "간섭 자극을 무시하고 목표 자극에만 반응하여 주의력과 간섭 억제 능력을 측정합니다.",
  },
];

export default function TestListPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-purple-900 mb-2">심리검사 목록</h1>
      <p className="text-gray-600 mb-8">
        무료 온라인 심리검사를 통해 자신의 상태를 확인해보세요.
      </p>

      {/* 설문 검사 */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">설문 검사</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {questionnaires.map((questionnaire) => (
          <Link
            key={questionnaire.id}
            href={`/test/${questionnaire.name}`}
            className="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-purple-300 transition"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {questionnaire.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {questionnaire.description}
            </p>
          </Link>
        ))}
      </div>

      {/* 주의력 검사 */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">주의력 검사</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attentionTests.map((test) => (
          <Link
            key={test.name}
            href={`/test/${test.name}`}
            className="block bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg hover:border-purple-300 transition"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {test.title}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2">
              {test.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
