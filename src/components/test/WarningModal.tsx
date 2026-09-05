"use client";

import { useEffect, useId, useState } from "react";

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/** 퇴장 애니메이션(globals.css .sheet-panel[data-closing])이 끝난 뒤 언마운트 */
const CLOSE_MS = 240;

export default function WarningModal({ isOpen, onClose }: WarningModalProps) {
  // isOpen이 false로 바뀐 뒤에도 시트가 내려가는 동안은 DOM에 남긴다
  const [mounted, setMounted] = useState(isOpen);
  const titleId = useId();

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      return;
    }
    const t = setTimeout(() => setMounted(false), CLOSE_MS);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!mounted) return null;
  const closing = !isOpen;

  return (
    <div
      className="overlay-scrim fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      data-closing={closing || undefined}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        data-closing={closing || undefined}
        className="sheet-panel origin-center relative w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl shadow-purple-950/20 overflow-hidden pb-[env(safe-area-inset-bottom)]"
      >
        <div className="flex items-center justify-between p-5 border-b border-purple-100 bg-purple-50">
          <h3 id={titleId} className="text-lg font-semibold text-purple-900">
            미응답 문항
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-purple-100 transition"
            aria-label="닫기"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6">
          <h4 className="text-base font-bold text-gray-900 mb-1">
            응답하지 않은 문항이 있습니다
          </h4>
          <p className="text-sm text-gray-600">
            빨간색으로 표시된 문항에 답해주세요
          </p>
        </div>
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            autoFocus
            className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
