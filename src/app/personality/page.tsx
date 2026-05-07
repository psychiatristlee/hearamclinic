import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "성격 검사",
  description:
    "Big 5 성격 검사를 비롯한 다양한 성격 검사를 무료로 진행해보세요. 5가지 차원으로 본인의 성격 유형을 알아볼 수 있습니다.",
};

const personalityTests = [
  {
    name: "big5",
    title: "Big 5 성격 검사",
    description:
      "개방성, 성실성, 외향성, 친화성, 정서 민감성의 5가지 차원으로 32개 유형 중 본인의 성격 유형을 알아봅니다.",
  },
];

export default function PersonalityListPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-purple-900 mb-2">성격 검사</h1>
      <p className="text-gray-600 mb-8">
        본인의 성격 특성을 5가지 차원으로 살펴보고 32개 유형 중 어디에 가까운지 알아보세요.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {personalityTests.map((test) => (
          <Link
            key={test.name}
            href={`/personality/${test.name}`}
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
