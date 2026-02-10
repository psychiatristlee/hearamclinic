import questionnaires from "@/lib/test/questionnaires";
import { Questionnaire as QuestionnaireType } from "@/lib/test/types";
import QuestionnaireForm from "@/components/test/QuestionnaireForm";
import StroopTest from "@/components/test/StroopTest";
import SelectiveAttentionTest from "@/components/test/SelectiveAttentionTest";
import SustainedInhibitionTest from "@/components/test/SustainedInhibitionTest";
import InterferenceAttentionTest from "@/components/test/InterferenceAttentionTest";
import Image from "next/image";
import type { Metadata } from "next";

const attentionTestMeta: Record<string, { title: string; description: string }> = {
  stroop: {
    title: "스트룹 검사 (Stroop Test)",
    description: "스트룹 검사로 집중력과 반응속도를 측정해보세요.",
  },
  "selective-attention": {
    title: "선택 주의력 검사 (Selective Attention)",
    description: "선택 주의력 검사로 올바른 대상을 선택하는 능력을 평가해보세요.",
  },
  "sustained-inhibition": {
    title: "억제지속 주의력 검사 (Go/No-Go)",
    description: "억제지속 주의력 검사로 주의력과 억제 능력을 측정해보세요.",
  },
  "interference-attention": {
    title: "간섭선택 주의력 검사 (Flanker Test)",
    description: "간섭선택 주의력 검사로 간섭 억제 능력을 측정해보세요.",
  },
};

export async function generateStaticParams() {
  const questionnaireParams = questionnaires.map((q) => ({ name: q.name }));
  const attentionParams = Object.keys(attentionTestMeta).map((name) => ({ name }));
  return [...questionnaireParams, ...attentionParams];
}

type TestPageProps = {
  params: Promise<{ name: string }>;
};

export async function generateMetadata(props: TestPageProps): Promise<Metadata> {
  const params = await props.params;
  const name = params.name;

  const questionnaire = questionnaires.find((q) => q.name === name);
  if (questionnaire) {
    return {
      title: questionnaire.title,
      description: questionnaire.description,
    };
  }

  const attention = attentionTestMeta[name];
  if (attention) {
    return {
      title: attention.title,
      description: attention.description,
    };
  }

  return { title: "심리검사" };
}

export default async function TestPage(props: TestPageProps) {
  const params = await props.params;
  const name = params.name;

  // 주의력 검사
  if (name === "stroop") return <StroopTest />;
  if (name === "selective-attention") return <SelectiveAttentionTest />;
  if (name === "sustained-inhibition") return <SustainedInhibitionTest />;
  if (name === "interference-attention") return <InterferenceAttentionTest />;

  // 설문 검사
  const questionnaire = questionnaires.find((q) => q.name === name);
  if (!questionnaire) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">검사를 찾을 수 없습니다</h1>
      </div>
    );
  }

  return <QuestionnaireView questionnaire={questionnaire} />;
}

function QuestionnaireView({ questionnaire }: { questionnaire: QuestionnaireType }) {
  return (
    <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="mb-4">
        <Image
          src={questionnaire.image}
          width={500}
          height={500}
          alt={questionnaire.title}
          className="w-full h-full object-cover"
          priority
        />
      </div>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-purple-900 mb-4">
          {questionnaire.title}
        </h1>
        <div className="divide-y divide-gray-200">
          <p className="mb-4 text-gray-700">{questionnaire.description}</p>
          <p className="pt-4 mb-4 text-sm font-medium text-gray-600">
            {questionnaire.instruction}
          </p>
          <QuestionnaireForm questionnaire={questionnaire} />
        </div>
      </div>
    </div>
  );
}
