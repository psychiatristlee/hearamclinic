"use client";

import { Suspense, useEffect } from "react";
import { useAuth, KAKAO_LOGIN_ENABLED } from "@/lib/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const { user, loading, signInWithGoogle, signInWithKakao } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && user) {
      router.replace(searchParams.get("redirect") || "/");
    }
  }, [user, loading, router, searchParams]);

  if (loading) return <p className="text-gray-500">로딩 중...</p>;
  if (user) return null;

  return (
    <div className="flex justify-center items-center min-h-[50vh] px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">로그인 · 회원가입</h1>
        <p className="text-gray-500 mb-6 leading-relaxed">
          검사 결과를 저장하고, 나의 변화 기록과<br className="hidden sm:block" /> AI 종합 성격 보고서를 받아보세요.
        </p>

        <ul className="text-left space-y-2.5 mb-7 bg-purple-50 border border-purple-100 rounded-2xl p-5">
          <li className="text-sm text-purple-900 flex items-start gap-2.5">
            <span>📌</span> <span>검사 결과를 영구 저장 — 언제든 다시 확인</span>
          </li>
          <li className="text-sm text-purple-900 flex items-start gap-2.5">
            <span>📈</span> <span>다시 검사하면 시간에 따른 변화 추세 그래프</span>
          </li>
          <li className="text-sm text-purple-900 flex items-start gap-2.5">
            <span>🧩</span> <span>여러 검사를 묶은 AI 종합 성격 보고서</span>
          </li>
        </ul>

        <div className="space-y-2.5">
          {KAKAO_LOGIN_ENABLED && (
            <button
              onClick={signInWithKakao}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FEE500] hover:brightness-95 text-[#191600] rounded-xl transition font-semibold shadow-md"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 3C6.9 3 3 6.2 3 10.2c0 2.6 1.8 4.9 4.4 6.2-.2.7-.7 2.5-.8 2.9 0 0 0 .3.2.4.1.1.4 0 .4 0 .5-.1 2.8-1.8 3.6-2.4.5.1 1 .1 1.5.1 5.1 0 9-3.2 9-7.2S17.1 3 12 3z" />
              </svg>
              카카오로 시작하기
            </button>
          )}
          <button
            onClick={signInWithGoogle}
            className={`w-full px-6 py-3.5 rounded-xl transition font-semibold shadow-md ${
              KAKAO_LOGIN_ENABLED
                ? "bg-white border border-gray-300 hover:bg-gray-50 text-gray-700"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            }`}
          >
            Google로 {KAKAO_LOGIN_ENABLED ? "계속하기" : "3초 만에 시작하기"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          별도 가입 절차 없이 소셜 계정으로 바로 시작해요.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">로딩 중...</p>}>
      <LoginContent />
    </Suspense>
  );
}
