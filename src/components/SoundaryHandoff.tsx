"use client";

import { useEffect, useMemo, useState } from "react";

const SECONDS = 4;

/**
 * 검사가 soundary.life(해람헬스케어)로 이관되었음을 안내한 뒤 자동 이동.
 * 현재 URL의 쿼리(?result=… 공유 파라미터 등)는 대상 URL에 병합해 전달한다.
 */
export default function SoundaryHandoff({
  targetUrl,
  testTitle,
}: {
  targetUrl: string;
  testTitle?: string;
}) {
  const [left, setLeft] = useState(SECONDS);

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

  useEffect(() => {
    const iv = setInterval(() => setLeft((s) => s - 1), 1000);
    const to = setTimeout(() => window.location.replace(finalUrl), SECONDS * 1000);
    return () => { clearInterval(iv); clearTimeout(to); };
  }, [finalUrl]);

  return (
    <div className="mx-auto max-w-lg mt-8 sm:mt-16 px-4">
      <div className="bg-white border border-purple-100 rounded-2xl shadow-sm p-8 text-center">
        <div className="text-5xl mb-4">🌊</div>
        <h1 className="text-2xl font-bold text-purple-900 mb-3">
          검사는 이제 Soundary에서 진행됩니다
        </h1>
        <p className="text-gray-700 leading-relaxed mb-2">
          해람검사실의 심리·인지 검사는 해람헬스케어가 운영하는 검사 전문 서비스{" "}
          <span className="font-semibold text-purple-700">Soundary</span>로 옮겨졌습니다.
        </p>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          {testTitle ? `「${testTitle}」를 포함한 ` : ""}모든 검사를 무료 그대로, 더 편리하게 이용하실 수 있습니다.
        </p>

        <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-6">
          <p className="text-sm text-purple-800">
            <span className="font-bold tabular-nums">{Math.max(left, 0)}초</span> 후 자동으로 이동합니다…
          </p>
        </div>

        <a
          href={finalUrl}
          className="block w-full px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition"
        >
          지금 바로 이동하기 →
        </a>
        <a href="/" className="inline-block mt-4 text-sm text-gray-400 hover:text-gray-600 underline underline-offset-2">
          해람정신과 홈으로 돌아가기
        </a>
      </div>
    </div>
  );
}
