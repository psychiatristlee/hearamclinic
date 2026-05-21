import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "성격 검사",
  description:
    "Big 5, 에니어그램, 애착, DISC 4가지 성격 검사와 종합 보고서. 다양한 시각으로 본인을 알아보세요.",
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
];

export default function PersonalityListPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-900 mb-2">성격 검사</h1>
        <p className="text-gray-600">
          본인을 다양한 결로 살펴보고, 모든 검사를 마치면 통합 보고서까지 받아 보세요.
        </p>
      </div>

      {/* 종합 보고서 진입 카드 (상단 강조) */}
      <Link
        href="/personality/report"
        className="group block mb-8 bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl overflow-hidden hover:shadow-2xl transition"
      >
        <div className="p-6 flex items-center gap-5">
          <div className="text-5xl flex-shrink-0">📊</div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">종합 성격 보고서</h3>
            <p className="text-sm text-purple-100 leading-relaxed">
              4가지 검사 결과를 AI가 통합 분석하여 한 사람의 다면적 프로필로 정리해 드립니다.
            </p>
          </div>
          <div className="text-2xl opacity-70 group-hover:translate-x-1 transition-transform">→</div>
        </div>
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {personalityTests.map((test) => (
          <Link
            key={test.name}
            href={`/personality/${test.name}`}
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
          </Link>
        ))}
      </div>
    </div>
  );
}
