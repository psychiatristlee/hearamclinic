import questionnaires from "@/lib/test/questionnaires";
import QuestionnaireResult from "@/components/test/QuestionnaireResult";
import Link from "next/link";
import type { Metadata } from "next";

export async function generateStaticParams() {
  return questionnaires.map((questionnaire) => ({ name: questionnaire.name }));
}

type ResultPageProps = {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(props: ResultPageProps): Promise<Metadata> {
  const params = await props.params;
  const questionnaire = questionnaires.find((q) => q.name === params.name);
  return {
    title: questionnaire ? `${questionnaire.title} 결과` : "검사 결과",
    description: questionnaire
      ? `${questionnaire.title} 검사 결과를 확인하세요.`
      : "심리검사 결과를 확인하세요.",
  };
}

export default async function ResultPage(props: ResultPageProps) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const questionnaire = questionnaires.find((q) => q.name === params.name);

  const otherTests = questionnaires
    .filter((q) => q.name !== params.name)
    .slice(0, 4);

  return (
    <div>
      {questionnaire ? (
        <QuestionnaireResult
          questionnaire={questionnaire}
          searchParams={searchParams}
        />
      ) : (
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-900">결과가 없습니다</h1>
        </div>
      )}

      {/* 다른 검사 추천 */}
      <div className="max-w-2xl mx-auto mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          다른 검사도 해보세요
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {otherTests.map((test) => (
            <Link
              key={test.id}
              href={`/test/${test.name}`}
              className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-purple-300 transition"
            >
              <h3 className="font-semibold text-gray-900 text-sm mb-1">
                {test.title}
              </h3>
              <p className="text-xs text-gray-500 line-clamp-1">
                {test.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
