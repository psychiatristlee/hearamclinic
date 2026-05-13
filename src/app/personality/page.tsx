import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

export const metadata: Metadata = {
  title: "성격 검사",
  description:
    "Big 5 성격 검사와 에니어그램 검사를 무료로 진행해보세요. 본인의 성격 유형을 다양한 시각으로 알아볼 수 있습니다.",
};

const personalityTests = [
  {
    name: "big5",
    title: "Big 5 성격 검사",
    description:
      "개방성, 성실성, 외향성, 친화성, 정서 민감성의 5가지 차원으로 32개 유형 중 본인의 성격 유형을 알아봅니다.",
    image:
      "https://firebasestorage.googleapis.com/v0/b/hearamclinic-ef507.firebasestorage.app/o/personality%2Fbig5%2Fcover.png?alt=media",
  },
  {
    name: "enneagram",
    title: "에니어그램 성격 검사",
    description:
      "9가지 유형으로 본인의 핵심 동기와 두려움을 살펴봅니다. 어떤 유형이 당신과 가장 닮았는지 알아보세요.",
    image:
      "https://firebasestorage.googleapis.com/v0/b/hearamclinic-ef507.firebasestorage.app/o/personality%2Fenneagram%2Fcover.png?alt=media",
  },
  {
    name: "attachment",
    title: "애착 유형 검사",
    description:
      "관계 속에서 본인이 어떤 마음의 결로 움직이는지, 불안과 회피 두 차원으로 4개 유형을 살펴봅니다.",
    image:
      "https://firebasestorage.googleapis.com/v0/b/hearamclinic-ef507.firebasestorage.app/o/personality%2Fattachment%2Fcover.png?alt=media",
  },
];

export default function PersonalityListPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-purple-900 mb-2">성격 검사</h1>
      <p className="text-gray-600 mb-8">
        본인의 성격 특성을 다양한 방식으로 살펴보고, 본인을 더 잘 이해해 보세요.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {personalityTests.map((test) => (
          <Link
            key={test.name}
            href={`/personality/${test.name}`}
            className="group block bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-purple-300 transition"
          >
            <div className="relative aspect-[16/9] bg-purple-50 overflow-hidden">
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
