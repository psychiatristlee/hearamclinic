import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "마음 돌봄",
  description:
    "명상 가이드, 사고 기록, 감사 일기 — 자가 돌봄을 위한 다양한 도구.",
};

const TOOLS = [
  {
    slug: "breathing",
    icon: "🧘",
    title: "명상",
    description: "상황에 맞는 호흡과 명상 기법 6가지 중에서 골라 따라해 보세요.",
  },
  {
    slug: "thought-record",
    icon: "📝",
    title: "사고 기록",
    description: "자동 사고의 인지 왜곡을 살피고 균형 잡힌 생각을 함께 정리합니다.",
  },
  {
    slug: "gratitude",
    icon: "🌿",
    title: "감사 일기",
    description: "오늘에 어울리는 감사 프롬프트 3개를 매번 새로 만들어 드립니다.",
  },
];

export default function CareIndexPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-purple-900 mb-2">마음 돌봄</h1>
        <p className="text-gray-600">
          자가 돌봄을 위한 다양한 도구들. 로그인하시면 오늘의 컨디션이 자연스럽게 반영됩니다.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TOOLS.map((tool) => (
          <Link
            key={tool.slug}
            href={`/care/${tool.slug}`}
            className="group block bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:border-purple-300 transition"
          >
            <div className="text-4xl mb-3">{tool.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-purple-700 transition">
              {tool.title}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-8 text-center">
        본 도구들은 자가 돌봄을 위한 보조 수단입니다. 의학적 진단·치료를 대체하지 않습니다.
      </p>
    </div>
  );
}
