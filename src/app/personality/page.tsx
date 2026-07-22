import { Metadata } from "next";
import Image from "next/image";
import {
  soundaryPersonalityUrl,
  soundaryBatteryUrl,
} from "@/lib/external-tests";

export const metadata: Metadata = {
  title: "무료 성격·심리 검사 모음 | Big 5·에니어그램·애착·DISC·RIASEC·심리도식 + AI 종합 보고서",
  description:
    "정신건강의학과에서 만든 무료 성격·심리 검사(Big 5·에니어그램·애착 유형·DISC·직업흥미 RIASEC·심리도식)와 AI 종합 성격 보고서를 한 곳에서. 가입 없이 바로 검사 가능, 결과 저장은 로그인 시 가능.",
  keywords: [
    "성격 검사",
    "무료 성격 검사",
    "성격 유형 검사",
    "성격 테스트",
    "심리 검사",
    "Big 5 검사",
    "빅5 성격 검사",
    "5요인 성격 검사",
    "에니어그램 검사",
    "에니어그램 9가지 유형",
    "애착 유형 검사",
    "성인 애착 유형",
    "DISC 검사",
    "DISC 행동 유형",
    "심리도식 검사",
    "스키마 검사",
    "초기부적응도식",
    "MBTI 대안",
    "성격 진단",
    "정신건강 자가 검사",
  ],
  alternates: { canonical: "https://hearam.kr/personality" },
  openGraph: {
    title: "무료 성격·직업흥미 검사 5종 + AI 종합 보고서 | 해람정신건강의학과",
    description:
      "Big 5·에니어그램·애착·DISC·직업흥미(RIASEC) 무료 검사 한 곳에서. 모두 마치면 AI가 통합 보고서를 만들어 드립니다.",
    url: "https://hearam.kr/personality",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "무료 성격·직업흥미 검사 5종 + AI 종합 보고서",
    description:
      "Big 5·에니어그램·애착·DISC 무료 성격 검사 한 곳에서.",
  },
};

const personalityTests = [
  {
    name: "big5",
    title: "Big 5 성격 검사",
    description: "5차원으로 32개 유형 중 본인의 성격 유형을 알아봅니다.",
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
    description: "관계 속 마음의 결을 불안과 회피 두 축으로 4유형 살펴봅니다.",
    image: "https://firebasestorage.googleapis.com/v0/b/hearamclinic-ef507.firebasestorage.app/o/personality%2Fattachment%2Fcover.png?alt=media",
  },
  {
    name: "disc",
    title: "DISC 행동 유형 검사",
    description: "주도·사교·안정·신중 4가지 행동 양식으로 본인의 패턴을 알아봅니다.",
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

const ITEM_LIST_JSONLD = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "무료 성격·심리 검사 6종",
  description:
    "Big 5·에니어그램·애착 유형·DISC·직업흥미 RIASEC·심리도식 6가지 검사와 AI 종합 보고서",
  itemListElement: personalityTests.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: t.title,
    url: `https://hearam.kr/personality/${t.name}`,
    description: t.description,
  })),
};

export default function PersonalityListPage() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ITEM_LIST_JSONLD) }}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-900 mb-2">
          무료 성격·심리 검사 — Big 5·에니어그램·애착·DISC·RIASEC·심리도식
        </h1>
        <p className="text-gray-600">
          정신건강의학과에서 만든 성격·심리 무료 검사 6종을 한 곳에서 진행하시고, 성격 검사는 AI 종합 보고서까지 받아 보세요.
        </p>
      </div>

      {/* 종합 보고서 진입 카드 (상단 강조) */}
      <a
        href={soundaryBatteryUrl()}
        className="group block mb-8 bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl overflow-hidden hover:shadow-2xl transition"
      >
        <div className="p-6 flex items-center gap-5">
          <div className="text-5xl flex-shrink-0">📊</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">종합 성격 보고서</h3>
            <p className="text-sm text-purple-100 leading-relaxed">
              성격 4종과 직업흥미(RIASEC)까지 5가지 검사 결과를 AI가 통합 분석하여 한 사람의 다면적 프로필로 정리해 드립니다.
            </p>
          </div>
          <div className="text-2xl opacity-70 group-hover:translate-x-1 transition-transform">→</div>
        </div>
      </a>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {personalityTests.map((test) => (
          <a
            key={test.name}
            href={soundaryPersonalityUrl(test.name) ?? `/personality/${test.name}`}
            className="group block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-purple-300 transition"
          >
            <div className="relative aspect-[16/9] bg-purple-50">
              <Image
                src={test.image}
                alt={test.title}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                unoptimized
              />
            </div>
            <div className="p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-700 transition">
                {test.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {test.description}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
