"use client";

import { useState } from "react";
import { useAuth, KAKAO_LOGIN_ENABLED } from "@/lib/AuthContext";

/**
 * 비로그인 사용자에게 "결과를 저장하려면 로그인" 유인 카드.
 * - 로그인하면 무엇을 얻는지(영구 저장·변화 추세·AI 종합 보고서) 혜택을 제시한다.
 * - 로그인은 페이지 이동 없이 제자리 Google 팝업으로 진행 → 결과가 유실되지 않는다.
 * - onSignedIn: 로그인 성공 직후 실행(예: 방금 본 결과를 저장). 선택.
 * 로그인 상태면 아무것도 렌더하지 않는다.
 */
export default function SaveLoginPrompt({
  message,
  onSignedIn,
}: {
  message?: string;
  onSignedIn?: () => void;
}) {
  const { user, loading, signInWithGoogle, signInWithKakao } = useAuth();
  const [busy, setBusy] = useState(false);

  // 로그인 여부 확정 전, 또는 이미 로그인 상태면 숨김
  if (loading || user) return null;

  async function handleLogin(provider: () => Promise<void>) {
    setBusy(true);
    try {
      await provider();
      onSignedIn?.();
    } catch {
      // 팝업 취소 등은 조용히 무시
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-6">
      <div className="flex items-start gap-3 mb-3">
        <div className="text-2xl flex-shrink-0">💾</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-amber-900 mb-0.5">이 결과, 저장해 둘까요?</p>
          <p className="text-xs text-amber-800 leading-relaxed">
            {message ??
              "로그인하면 지금 결과가 사라지지 않고, 나중에 언제든 다시 확인할 수 있어요."}
          </p>
        </div>
      </div>

      <ul className="space-y-1.5 mb-4 pl-1">
        <li className="text-xs text-amber-900 flex items-center gap-2">
          <span>📌</span> 검사 결과를 영구 저장 — 언제든 다시 확인
        </li>
        <li className="text-xs text-amber-900 flex items-center gap-2">
          <span>📈</span> 다시 검사하면 시간에 따른 변화 추세 그래프
        </li>
        <li className="text-xs text-amber-900 flex items-center gap-2">
          <span>🧩</span> 여러 검사를 묶은 AI 종합 성격 보고서
        </li>
      </ul>

      <div className="space-y-2">
        {KAKAO_LOGIN_ENABLED && (
          <button
            onClick={() => handleLogin(signInWithKakao)}
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#FEE500] hover:brightness-95 disabled:opacity-60 text-[#191600] text-sm font-semibold rounded-lg transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M12 3C6.9 3 3 6.2 3 10.2c0 2.6 1.8 4.9 4.4 6.2-.2.7-.7 2.5-.8 2.9 0 0 0 .3.2.4.1.1.4 0 .4 0 .5-.1 2.8-1.8 3.6-2.4.5.1 1 .1 1.5.1 5.1 0 9-3.2 9-7.2S17.1 3 12 3z" />
            </svg>
            {busy ? "로그인 중..." : "카카오로 로그인하고 저장하기"}
          </button>
        )}
        <button
          onClick={() => handleLogin(signInWithGoogle)}
          disabled={busy}
          className={`w-full text-center px-4 py-2.5 disabled:opacity-60 text-sm font-semibold rounded-lg transition ${
            KAKAO_LOGIN_ENABLED
              ? "bg-white border border-amber-300 hover:bg-amber-100 text-amber-900"
              : "bg-amber-600 hover:bg-amber-700 text-white"
          }`}
        >
          {busy
            ? "로그인 중..."
            : KAKAO_LOGIN_ENABLED
              ? "Google로 로그인"
              : "Google로 로그인하고 저장하기"}
        </button>
      </div>
      <p className="text-[11px] text-amber-700/80 text-center mt-2">
        가입 절차 없이 3초면 시작해요 · 지금 보던 결과 그대로 저장돼요
      </p>
    </div>
  );
}
