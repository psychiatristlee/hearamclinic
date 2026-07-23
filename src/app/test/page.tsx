import { Metadata } from "next";
import questionnaires from "@/lib/test/questionnaires";
import Image from "next/image";

export const metadata: Metadata = {
  title: "무료 인지능력·두뇌 테스트 모음 | 기억력·집중력·반응속도·IQ·성격 검사",
  description:
    "기억력 테스트, 반응속도 테스트, 집중력 테스트, IQ 검사부터 우울·불안 자가 설문과 성격 검사까지 — 정신건강의학과에서 만든 무료 두뇌·심리 검사를 한 곳에서 진행해 보세요.",
  keywords: [
    "인지능력 테스트",
    "두뇌 테스트",
    "두뇌 게임",
    "기억력 테스트",
    "집중력 테스트",
    "주의력 검사",
    "반응속도 테스트",
    "IQ 테스트",
    "치매 예방 게임 무료",
    "ADHD 테스트",
    "심리 검사",
  ],
  alternates: { canonical: "https://hearam.kr/test" },
  openGraph: {
    title: "무료 인지능력·두뇌 테스트 모음 | 해람정신건강의학과",
    description:
      "기억력·반응속도·집중력·IQ·성격 검사까지 무료 두뇌 테스트를 한 곳에서.",
    url: "https://hearam.kr/test",
    type: "website",
  },
};

const attentionTests = [
  {
    name: "stroop",
    title: "스트룹 검사",
    description: "글자 색깔과 의미가 다를 때 색깔을 빠르게 선택해 집중력과 반응속도를 측정합니다.",
  },
  {
    name: "selective-attention",
    title: "선택 주의력 검사",
    description: "빠르게 변하는 자극 중에서 목표 대상만 정확히 선택하는 능력을 평가합니다.",
  },
  {
    name: "sustained-inhibition",
    title: "억제지속 주의력 (Go/No-Go)",
    description: "반응할 자극과 억제할 자극을 구분해 주의력과 억제 능력을 측정합니다.",
  },
  {
    name: "interference-attention",
    title: "간섭선택 주의력 (Flanker)",
    description: "간섭 자극을 무시하고 목표 자극에만 반응하는 능력을 측정합니다.",
  },
  {
    name: "n-back",
    title: "N-back (2-back)",
    description: "두 단계 전 본 글자를 기억하며 작업기억과 지속 주의력을 측정합니다.",
  },
  {
    name: "digit-span",
    title: "숫자 폭 검사",
    description: "차례로 제시되는 숫자를 순서대로 회상하여 단기기억을 측정합니다.",
  },
  {
    name: "trail-making",
    title: "궤적 잇기 검사",
    description: "흩어진 숫자를 1부터 15까지 순서대로 연결해 시각적 주의력을 측정합니다.",
  },
  {
    name: "reaction-time",
    title: "반응속도 테스트",
    description: "초록불이 켜지는 순간 클릭! 평균 반응속도(ms)로 순발력·반사신경을 측정합니다.",
  },
  {
    name: "spatial-span",
    title: "공간 기억력 테스트 (코르시 블록)",
    description: "블록이 켜지는 순서를 기억해 재현하며 시공간 작업기억 폭을 측정합니다.",
  },
  {
    name: "task-switching",
    title: "두뇌 회전 테스트 (과제 전환)",
    description: "시행마다 바뀌는 규칙에 적응하는 속도로 인지 유연성·전두엽 기능을 살펴봅니다.",
  },
];

const personalityTests = [
  {
    name: "big5",
    title: "Big 5 성격 검사",
    description: "5가지 차원으로 32개 유형 중 본인의 성격 유형을 알아봅니다.",
    image: "https://firebasestorage.googleapis.com/v0/b/hearamclinic-ef507.firebasestorage.app/o/personality%2Fbig5%2Fcover.png?alt=media",
  },
  {
    name: "enneagram",
    title: "에니어그램 성격 검사",
    description: "9가지 유형으로 본인의 핵심 동기와 두려움을 살펴봅니다.",
    image: "https://firebasestorage.googleapis.com/v0/b/hearamclinic-ef507.firebasestorage.app/o/personality%2Fenneagram%2Fcover.png?alt=media",
  },
  {
    name: "attachment",
    title: "애착 유형 검사",
    description: "관계 속에서 본인의 마음 결을 불안·회피 두 축으로 4가지 유형으로 살펴봅니다.",
    image: "https://firebasestorage.googleapis.com/v0/b/hearamclinic-ef507.firebasestorage.app/o/personality%2Fattachment%2Fcover.png?alt=media",
  },
  {
    name: "disc",
    title: "DISC 행동 유형 검사",
    description: "주도·사교·안정·신중 4가지 행동 양식으로 본인의 패턴과 관계 스타일을 살펴봅니다.",
    image: "https://firebasestorage.googleapis.com/v0/b/hearamclinic-ef507.firebasestorage.app/o/personality%2Fdisc%2Fcover.png?alt=media",
  },
  {
    name: "riasec",
    title: "직업흥미 검사 (RIASEC)",
    description: "홀랜드 6유형으로 나에게 맞는 직업과 진로 방향을 살펴봅니다.",
    image: "https://firebasestorage.googleapis.com/v0/b/hearamclinic-ef507.firebasestorage.app/o/personality%2Friasec%2Fcover.png?alt=media",
  },
  {
    name: "schema",
    title: "심리도식 검사",
    description: "어린 시절에 만들어져 지금도 반복되는 마음의 무늬를 18도식·5영역으로 살펴봅니다.",
    image: "https://firebasestorage.googleapis.com/v0/b/hearamclinic-ef507.firebasestorage.app/o/personality%2Fschema%2Fcover.png?alt=media",
  },
];

export default function TestListPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-900 mb-2">검사</h1>
        <p className="text-gray-600">
          마음 상태부터 집중력, 성격 유형까지 — 본인을 더 잘 알기 위한 자가 검사들
        </p>
      </div>

      {/* 심리 설문 */}
      <section id="questionnaire" className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <span>📋</span> 심리 설문
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          우울·불안·ADHD·스트레스 등 마음의 상태를 점검하는 임상 설문
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {questionnaires.map((q) => (
            <a
              key={q.id}
              href={`/test/${q.name}`}
              className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-purple-300 transition"
            >
              <h3 className="font-semibold text-gray-900 mb-1">{q.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{q.description}</p>
            </a>
          ))}
        </div>
      </section>

      {/* 지능 검사 */}
      <section id="iq" className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <span>🧩</span> 지능 검사
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          언어·수리·도형·기억·속도 5개 영역으로 인지능력을 종합 측정
        </p>
        <a
          href={"/test/iq"}
          className="group block bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-2xl overflow-hidden hover:shadow-2xl transition"
        >
          <div className="p-5 flex items-center gap-4">
            <div className="text-4xl flex-shrink-0">🧩</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold mb-0.5">종합 인지능력 검사 (IQ)</h3>
              <p className="text-sm text-indigo-100 leading-relaxed">
                언어 추리·수리 추리·도형 추리·작업 기억·처리 속도 — 약 20분. 수검자 통계가 쌓일수록 편차 IQ로 나의 위치를 확인할 수 있어요.
              </p>
            </div>
            <div className="text-2xl opacity-70 group-hover:translate-x-1 transition-transform">→</div>
          </div>
        </a>
      </section>

      {/* 집중력 검사 */}
      <section id="attention" className="mb-12">
        <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <span>🧠</span> 집중력 검사
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          주의력의 여러 측면을 인지 과제로 직접 측정
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {attentionTests.map((t) => (
            <a
              key={t.name}
              href={`/test/${t.name}`}
              className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-purple-300 transition"
            >
              <h3 className="font-semibold text-gray-900 mb-1">{t.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{t.description}</p>
            </a>
          ))}
        </div>
      </section>

      {/* 성격 검사 */}
      <section id="personality" className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <span>🌱</span> 성격 검사
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          본인의 성격 유형을 다양한 방식으로 살펴보기
        </p>

        {/* 종합 성격 보고서 진입 카드 */}
        <a
          href={"/personality/report"}
          className="group block mb-5 bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl overflow-hidden hover:shadow-2xl transition"
        >
          <div className="p-5 flex items-center gap-4">
            <div className="text-4xl flex-shrink-0">📊</div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold mb-0.5">AI 종합 성격 보고서</h3>
              <p className="text-sm text-purple-100 leading-relaxed">
                5가지 검사(성격 4종 + 직업흥미)를 마치면 AI가 통합 분석해 한 장의 프로필로 정리해 드려요.
              </p>
            </div>
            <div className="text-2xl opacity-70 group-hover:translate-x-1 transition-transform">→</div>
          </div>
        </a>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personalityTests.map((t) => (
            <a
              key={t.name}
              href={`/personality/${t.name}`}
              className="group block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-purple-300 transition"
            >
              <div className="relative aspect-[16/9] bg-purple-50">
                <Image
                  src={t.image}
                  alt={t.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-purple-700 transition">
                  {t.title}
                </h3>
                <p className="text-sm text-gray-600">{t.description}</p>
              </div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}
