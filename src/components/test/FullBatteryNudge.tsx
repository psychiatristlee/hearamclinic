"use client";

import { useSearchParams } from "next/navigation";
import { SOUNDARY_PERSONALITY_CATALOG_URL } from "@/lib/external-tests";

interface Props {
  href?: string;
  emoji?: string;
  title?: string;
  desc?: string;
  cta?: string;
}

/**
 * 개별 검사 결과 화면에서 "전체 심리검사(종합 성격 보고서)도 해보라"고 유도하는 카드.
 * 가이드 모드(?guided=1)에서는 GuidedNextButton이 흐름을 담당하므로 숨긴다.
 */
export default function FullBatteryNudge({
  href,
  emoji = "📊",
  title = "다른 성격 검사도 이어서 해보세요",
  desc = "성격·애착·직업흥미 등 다양한 검사를 Soundary에서 계속 진행할 수 있습니다.",
  cta = "사운더리에서 검사 이어서 하기",
}: Props) {
  const searchParams = useSearchParams();
  if (searchParams?.get("guided") === "1") return null;

  return (
    <a
      href={href ?? SOUNDARY_PERSONALITY_CATALOG_URL}
      className="group block mb-4 bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl overflow-hidden hover:shadow-xl transition"
    >
      <div className="p-5 flex items-center gap-4">
        <div className="text-3xl flex-shrink-0">{emoji}</div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold mb-0.5">{title}</p>
          <p className="text-sm text-purple-100 leading-relaxed">{desc}</p>
          <span className="inline-block mt-2 text-sm font-semibold underline underline-offset-2">
            {cta} →
          </span>
        </div>
        <div className="text-2xl opacity-70 group-hover:translate-x-1 transition-transform">→</div>
      </div>
    </a>
  );
}
