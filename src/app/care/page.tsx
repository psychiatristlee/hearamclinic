import { Metadata } from "next";
import Link from "next/link";
import CareTabsNav from "@/components/care/CareTabsNav";

export const metadata: Metadata = {
  title: "마음 돌봄",
  description:
    "AI가 당신의 컨디션에 맞춰 만드는 호흡, CBT 사고 정리, 감사 일기, 마음챙김 명상 가이드. 지금 바로 시작해 보세요.",
};

const TOOLS = [
  {
    slug: "counselor",
    icon: "💬",
    title: "해람 동행 챗봇",
    description:
      "CBT와 ACT의 결로 마음을 함께 살피는 대화형 자가 돌봄. 가벼운 마음의 정리부터 위기 상황 안내까지 함께합니다.",
  },
  {
    slug: "breathing",
    icon: "🌬",
    title: "호흡 가이드",
    description:
      "지금 컨디션에 맞춰 1-3분 호흡 가이드를 생성합니다. 긴장이 올라올 때 가장 먼저 시도하기 좋습니다.",
  },
  {
    slug: "thought-record",
    icon: "📝",
    title: "CBT 사고 기록",
    description:
      "마음에 떠오른 자동 사고를 입력하시면 인지 왜곡을 살피고 균형 잡힌 생각을 함께 정리해 드립니다.",
  },
  {
    slug: "gratitude",
    icon: "🌿",
    title: "감사 일기",
    description:
      "오늘에 어울리는 감사 프롬프트 3개를 매번 새로 만들어 드립니다. 진부하지 않게.",
  },
  {
    slug: "mindfulness",
    icon: "🧘",
    title: "마음챙김 명상",
    description:
      "원하는 시간과 초점을 알려주시면 ACT의 결로 짧은 명상 스크립트를 만들어 드립니다.",
  },
];

export default function CareIndexPage() {
  return (
    <div>
      <CareTabsNav />
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-purple-900 mb-1">마음 돌봄</h1>
        <p className="text-sm text-gray-600">
          탭을 눌러 원하는 도구를 바로 시작해 보세요. 로그인 시 오늘의 컨디션이 자연스럽게 반영됩니다.
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
