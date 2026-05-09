import { Metadata } from "next";
import questionnaires from "@/lib/test/questionnaires";
import Link from "next/link";

export const metadata: Metadata = {
  title: "심리검사 목록",
  description:
    "무료 온라인 심리검사를 통해 자신의 상태를 확인해보세요. 우울증, 불안, ADHD, 양극성 장애, 알코올 사용 장애, 스트레스 등 다양한 심리검사를 제공합니다.",
};

export default function TestListPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-purple-900 mb-2">심리검사</h1>
      <p className="text-gray-600 mb-8">
        무료 온라인 자가 검사로 본인의 마음 상태를 점검해보세요.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
    </div>
  );
}
