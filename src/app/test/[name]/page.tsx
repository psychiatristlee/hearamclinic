import questionnaires from "@/lib/test/questionnaires";
import { Questionnaire as QuestionnaireType } from "@/lib/test/types";
import QuestionnaireForm from "@/components/test/QuestionnaireForm";
import StroopTest from "@/components/test/StroopTest";
import SelectiveAttentionTest from "@/components/test/SelectiveAttentionTest";
import SustainedInhibitionTest from "@/components/test/SustainedInhibitionTest";
import InterferenceAttentionTest from "@/components/test/InterferenceAttentionTest";
import NBackTest from "@/components/test/NBackTest";
import DigitSpanTest from "@/components/test/DigitSpanTest";
import TrailMakingTest from "@/components/test/TrailMakingTest";
import IqTest from "@/components/test/iq/IqTest";
import ReactionTimeTest from "@/components/test/ReactionTimeTest";
import SpatialSpanTest from "@/components/test/SpatialSpanTest";
import TaskSwitchingTest from "@/components/test/TaskSwitchingTest";
import SoundaryHandoff from "@/components/SoundaryHandoff";
import { soundaryTestUrl } from "@/lib/external-tests";
import Image from "next/image";
import type { Metadata } from "next";

const attentionTestMeta: Record<
  string,
  { title: string; description: string; keywords?: string[] }
> = {
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
  "n-back": {
    title: "N-back 검사 (2-back)",
    description: "N-back 검사로 작업기억과 지속 주의력을 측정해보세요.",
  },
  "digit-span": {
    title: "숫자 폭 검사 (Digit Span)",
    description: "숫자 폭 검사로 단기기억과 주의 지속 능력을 측정해보세요.",
  },
  "trail-making": {
    title: "궤적 잇기 검사 (Trail Making Test)",
    description: "궤적 잇기 검사로 시각적 주의력과 처리 속도를 측정해보세요.",
  },
  iq: {
    title: "무료 종합 인지능력 검사 (IQ 테스트) — 언어·수리·도형·기억·속도 5영역",
    description:
      "언어 추리, 수리 추리, 도형 행렬 추리, 작업 기억, 처리 속도까지 5개 영역으로 측정하는 무료 온라인 인지능력(IQ) 검사. 수검자 규준 통계가 쌓일수록 편차 IQ(평균 100·표준편차 15)로 나의 상대적 위치를 확인할 수 있습니다.",
    keywords: ["IQ 테스트", "아이큐 테스트", "무료 IQ 검사", "지능 검사", "인지능력 테스트", "두뇌 테스트", "온라인 IQ"],
  },
  "reaction-time": {
    title: "반응속도 테스트 — 평균 기록·반사신경 측정 (무료)",
    description:
      "화면이 초록색으로 바뀌는 순간 클릭! 5회 측정으로 평균 반응속도(ms)를 확인하는 무료 반응속도 테스트. 일반 성인 평균(200~350ms)과 다른 수검자들의 기록과 비교해 나의 순발력·반사신경을 알아보세요.",
    keywords: ["반응속도 테스트", "반응속도 측정", "순발력 테스트", "반사신경 테스트", "평균 반응속도", "게임 반응속도", "동체시력 테스트"],
  },
  "spatial-span": {
    title: "공간 기억력 테스트 (코르시 블록) — 순간·순서 기억력 측정",
    description:
      "블록이 켜지는 순서를 기억해 그대로 재현하는 무료 공간 기억력 테스트(코르시 블록 방식). 3칸부터 9칸까지 나의 시공간 작업기억 폭을 측정하고 다른 사람들과 비교해 보세요. 일반 성인 평균은 5칸 안팎입니다.",
    keywords: ["기억력 테스트", "공간 기억력 테스트", "순간 기억력 테스트", "순서 기억력 테스트", "시각 기억력 테스트", "단기 기억력 테스트", "작업기억 검사", "코르시 블록 검사"],
  },
  "task-switching": {
    title: "두뇌 회전 테스트 — 인지 유연성·전두엽 기능 측정 (과제 전환)",
    description:
      "색깔과 모양, 시행마다 바뀌는 규칙에 얼마나 빠르게 적응할까요? 규칙 전환 시 느려지는 정도(전환 비용)로 인지 유연성과 전두엽 기능을 살펴보는 무료 두뇌 회전 테스트. 멀티태스킹 능력이 궁금하다면 도전해 보세요.",
    keywords: ["두뇌 회전 테스트", "멀티태스킹 테스트", "인지 유연성 테스트", "전두엽 기능 테스트", "과제 전환 검사", "뇌 나이 테스트", "두뇌 게임"],
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
    const canonical = `https://hearam.kr/test/${name}`;
    return {
      title: attention.title,
      description: attention.description,
      keywords: attention.keywords,
      alternates: { canonical },
      openGraph: {
        title: attention.title,
        description: attention.description,
        url: canonical,
        type: "website",
      },
      twitter: {
        card: "summary",
        title: attention.title,
        description: attention.description,
      },
    };
  }

  return { title: "심리검사" };
}

function pickTestComponent(name: string) {
  if (name === "stroop") return <StroopTest />;
  if (name === "selective-attention") return <SelectiveAttentionTest />;
  if (name === "sustained-inhibition") return <SustainedInhibitionTest />;
  if (name === "interference-attention") return <InterferenceAttentionTest />;
  if (name === "n-back") return <NBackTest />;
  if (name === "digit-span") return <DigitSpanTest />;
  if (name === "trail-making") return <TrailMakingTest />;
  if (name === "iq") return <IqTest />;
  if (name === "reaction-time") return <ReactionTimeTest />;
  if (name === "spatial-span") return <SpatialSpanTest />;
  if (name === "task-switching") return <TaskSwitchingTest />;
  return null;
}

export default async function TestPage(props: TestPageProps) {
  const params = await props.params;
  const name = params.name;

  // soundary.life 로 이관된 검사 — 안내 후 자동 이동
  const soundary = soundaryTestUrl(name);
  if (soundary) {
    const title =
      attentionTestMeta[name]?.title ??
      questionnaires.find((q) => q.name === name)?.title;
    return <SoundaryHandoff targetUrl={soundary} testTitle={title} />;
  }

  const attentionEl = pickTestComponent(name);
  if (attentionEl) return attentionEl;

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
