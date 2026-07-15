import { Metadata } from "next";
import questionnaires from "@/lib/test/questionnaires";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "검사",
  description:
    "심리 설문, 집중력 검사, 성격 검사를 한 곳에서. 우울·불안·ADHD 자가 검사부터 Big 5·에니어그램·애착 유형까지 무료로 진행해보세요.",
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
            <Link
              key={q.id}
              href={`/test/${q.name}`}
              className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-purple-300 transition"
            >
              <h3 className="font-semibold text-gray-900 mb-1">{q.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{q.description}</p>
            </Link>
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
        <Link
          href="/test/iq"
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
        </Link>
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
            <Link
              key={t.name}
              href={`/test/${t.name}`}
              className="block bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg hover:border-purple-300 transition"
            >
              <h3 className="font-semibold text-gray-900 mb-1">{t.title}</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{t.description}</p>
            </Link>
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
        <Link
          href="/personality/report"
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
        </Link>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personalityTests.map((t) => (
            <Link
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
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
