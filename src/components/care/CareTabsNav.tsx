"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab {
  href: string;
  icon: string;
  label: string;
  shortLabel: string;
  matchPaths: string[]; // 어떤 경로에서 활성화되는지
}

const TABS: Tab[] = [
  {
    href: "/test",
    icon: "🔬",
    label: "검사",
    shortLabel: "검사",
    matchPaths: ["/test", "/attention", "/personality"],
  },
  {
    href: "/care/counselor",
    icon: "💬",
    label: "해람 동행",
    shortLabel: "동행",
    matchPaths: ["/care/counselor"],
  },
  {
    href: "/care/breathing",
    icon: "🌬",
    label: "호흡 가이드",
    shortLabel: "호흡",
    matchPaths: ["/care/breathing"],
  },
  {
    href: "/care/thought-record",
    icon: "📝",
    label: "CBT 사고 기록",
    shortLabel: "CBT",
    matchPaths: ["/care/thought-record"],
  },
  {
    href: "/care/gratitude",
    icon: "🌿",
    label: "감사 일기",
    shortLabel: "감사",
    matchPaths: ["/care/gratitude"],
  },
  {
    href: "/care/mindfulness",
    icon: "🧘",
    label: "마음챙김",
    shortLabel: "명상",
    matchPaths: ["/care/mindfulness"],
  },
];

export default function CareTabsNav() {
  const pathname = usePathname() ?? "";

  function isActive(tab: Tab): boolean {
    return tab.matchPaths.some((p) => {
      if (p === pathname) return true;
      // /personality/big5 같은 sub-path도 매칭
      return pathname.startsWith(p + "/");
    });
  }

  return (
    <div className="mb-6 -mx-4 px-4 overflow-x-auto">
      <div className="flex gap-1.5 min-w-max sm:min-w-0 sm:justify-center">
        {TABS.map((tab) => {
          const active = isActive(tab);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-sm font-medium transition whitespace-nowrap ${
                active
                  ? "bg-purple-600 text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-700 hover:border-purple-300 hover:text-purple-700"
              }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
