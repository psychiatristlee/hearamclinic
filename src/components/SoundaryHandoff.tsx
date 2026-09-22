"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * 이 검사는 심리검사 전문 플랫폼 Soundary(사운더리)에서 진행된다는 안내를 보여준 뒤
 * 잠시 안내를 보여준 뒤 Soundary로 자동 이동한다.
 */
export default function SoundaryHandoff({
  targetUrl,
  testTitle,
}: {
  targetUrl: string;
  testTitle?: string;
}) {
  const [secondsLeft, setSecondsLeft] = useState(5);

  useEffect(() => {
    const interval = window.setInterval(() => setSecondsLeft((seconds) => Math.max(0, seconds - 1)), 1000);
    const redirect = window.setTimeout(() => window.location.assign(targetUrl), 5000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(redirect);
    };
  }, [targetUrl]);

  return (
    <div className="mx-auto max-w-lg mt-8 sm:mt-16 px-4">
      <div className="bg-white border border-purple-100 rounded-2xl shadow-sm p-8 text-center">
        <div className="text-5xl mb-4">🌊</div>
        <h1 className="text-2xl font-bold tracking-tight text-purple-900 mb-3">
          {testTitle ? `「${testTitle}」는 ` : "이 검사는 "}Soundary에서 진행됩니다
        </h1>
        <p className="text-gray-700 leading-relaxed mb-2">
          심리검사는 이제 전문 플랫폼{" "}
          <span className="font-semibold text-purple-700">Soundary(사운더리)</span>에서 시행됩니다.
        </p>
        <p role="status" className="text-sm text-gray-600 leading-relaxed mb-6">
          {secondsLeft}초 뒤 사운더리로 자동 이동합니다. 바로 이동하려면 아래 버튼을 눌러주세요.
        </p>

        <a
          href={targetUrl}
          className="pressable block w-full px-6 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-lg shadow-purple-900/15"
        >
          사운더리로 바로 이동하기 →
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
