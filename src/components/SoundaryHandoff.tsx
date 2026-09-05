"use client";

import Link from "next/link";
import { useMemo } from "react";

/**
 * 이 검사는 심리검사 전문 플랫폼 Soundary(사운더리)에서 진행된다는 안내를 보여준 뒤
 * 버튼을 누르면 Soundary로 이동한다.
 * 현재 URL의 쿼리(?result=… 등 공유 파라미터)는 대상 URL에 병합해 전달한다.
 */
export default function SoundaryHandoff({
  targetUrl,
  testTitle,
}: {
  targetUrl: string;
  testTitle?: string;
}) {
  // 현재 쿼리 파라미터를 대상 URL에 병합
  const finalUrl = useMemo(() => {
    if (typeof window === "undefined") return targetUrl;
    try {
      const target = new URL(targetUrl);
      const current = new URLSearchParams(window.location.search);
      current.forEach((v, k) => {
        if (!target.searchParams.has(k)) target.searchParams.set(k, v);
      });
      return target.toString();
    } catch {
      return targetUrl;
    }
  }, [targetUrl]);

  return (
    <div className="mx-auto max-w-lg mt-8 sm:mt-16 px-4">
      <div className="bg-white border border-purple-100 rounded-2xl shadow-sm p-8 text-center">
        <div className="text-5xl mb-4">🌊</div>
        <h1 className="text-2xl font-bold tracking-tight text-purple-900 mb-3">
          {testTitle ? `「${testTitle}」는 ` : "이 검사는 "}Soundary에서 진행됩니다
        </h1>
        <p className="text-gray-700 leading-relaxed mb-2">
          이 검사는 심리검사 전문 플랫폼{" "}
          <span className="font-semibold text-purple-700">Soundary(사운더리)</span>에서 시행됩니다.
        </p>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          아래 버튼을 누르면 Soundary로 이동해 검사를 무료로 진행하실 수 있습니다.
        </p>

        <a
          href={finalUrl}
          className="pressable block w-full px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-900/15"
        >
          Soundary에서 검사 시작하기 →
        </a>
        <Link
          href="/test"
          className="inline-block mt-4 text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2"
        >
          다른 검사 보러 가기
        </Link>
      </div>
    </div>
  );
}
