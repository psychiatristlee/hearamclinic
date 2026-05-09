import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "집중력 검사",
  description:
    "스트룹, N-back, 숫자 폭, 궤적 잇기 등 집중력과 주의력을 측정하는 다양한 검사를 무료로 진행해보세요.",
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
  {
    name: "n-back",
    title: "N-back 검사 (2-back)",
    description: "두 단계 전에 본 글자를 기억하며 매치 여부를 판단해 작업기억과 지속 주의력을 측정합니다.",
  },
  {
    name: "digit-span",
    title: "숫자 폭 검사 (Digit Span)",
    description: "차례로 제시되는 숫자를 본 순서대로 회상하여 단기기억과 주의 지속 능력을 측정합니다.",
  },
  {
    name: "trail-making",
    title: "궤적 잇기 검사 (Trail Making Test)",
    description: "흩어진 숫자를 1부터 15까지 순서대로 빠르게 연결해 시각적 주의와 처리 속도를 측정합니다.",
  },
];

export default function AttentionListPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-purple-900 mb-2">집중력 검사</h1>
      <p className="text-gray-600 mb-8">
        다양한 인지 과제로 집중력과 주의력의 여러 측면을 점검해보세요.
      </p>

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
