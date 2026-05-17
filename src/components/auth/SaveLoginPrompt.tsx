"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { auth } from "@/lib/firebase";

/**
 * 비로그인 사용자에게 "결과를 기록으로 남기려면 로그인" 안내 카드.
 * 로그인된 상태면 아무것도 렌더하지 않음.
 */
export default function SaveLoginPrompt({
  message = "이 결과를 기록으로 남기고 다음에 다시 확인하시려면 로그인해 주세요.",
}: {
  message?: string;
}) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setSignedIn(!!u));
    return () => unsub();
  }, []);

  // 로그인 여부 확정 전엔 잠깐 숨김
  if (signedIn !== false) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center">
      <div className="text-2xl flex-shrink-0">💾</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-amber-900 mb-0.5">
          이 결과는 저장되지 않았습니다
        </p>
        <p className="text-xs text-amber-800 leading-relaxed">{message}</p>
      </div>
      <Link
        href={`/login?redirect=${encodeURIComponent(pathname)}`}
        className="flex-shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg transition whitespace-nowrap"
      >
        로그인하기
      </Link>
    </div>
  );
}
