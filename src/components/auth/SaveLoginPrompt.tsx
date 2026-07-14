"use client";

import { useState } from "react";
import { useAuth } from "@/lib/AuthContext";

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
  const { user, loading, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);

  // 로그인 여부 확정 전, 또는 이미 로그인 상태면 숨김
  if (loading || user) return null;

  async function handleLogin() {
    setBusy(true);
    try {
      await signInWithGoogle();
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

      <button
        onClick={handleLogin}
        disabled={busy}
        className="block w-full text-center px-4 py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-semibold rounded-lg transition"
      >
        {busy ? "로그인 중..." : "Google로 로그인하고 저장하기"}
      </button>
      <p className="text-[11px] text-amber-700/80 text-center mt-2">
        가입 절차 없이 3초면 시작해요 · 지금 보던 결과 그대로 저장돼요
      </p>
    </div>
  );
}
