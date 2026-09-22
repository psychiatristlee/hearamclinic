import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SoundaryBanner from "@/components/SoundaryBanner";

export const metadata: Metadata = {
  title: "무료 성격·심리 검사 안내 | 사운더리에서 검사하기",
  description:
    "Big 5·에니어그램·애착 유형·DISC·직업흥미 RIASEC·심리도식 검사는 사운더리에서 무료로 진행합니다. 검사별 안내를 확인하고 이동하세요.",
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
    title: "무료 성격·심리 검사 안내 | 해람정신건강의학과",
    description:
      "Big 5·에니어그램·애착·DISC·직업흥미·심리도식 검사는 사운더리에서 진행합니다.",
    url: "https://hearam.kr/personality",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "무료 성격·심리 검사 안내",
    description:
      "Big 5·에니어그램·애착·DISC 무료 성격 검사는 사운더리에서 진행합니다.",
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
    "Big 5·에니어그램·애착 유형·DISC·직업흥미 RIASEC·심리도식 6가지 검사는 사운더리에서 진행",
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
          성격·심리 검사 6종을 선택하면 사운더리로 이동 후 무료로 진행하실 수 있습니다.
        </p>
      </div>

      <SoundaryBanner className="mb-8" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {personalityTests.map((test) => (
          <Link
            key={test.name}
            href={`/personality/${test.name}`}
            className="card-lift group block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-purple-300"
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
              <p className="mt-2 text-xs font-semibold text-purple-700">사운더리로 이동 후 진행 ↗</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
