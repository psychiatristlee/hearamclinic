"use client";

import { useState } from "react";
import {
  submitFeedback,
  FEEDBACK_CATEGORY_LABELS,
  type FeedbackCategory,
} from "@/lib/feedback";

const CATEGORIES: FeedbackCategory[] = ["improvement", "bug", "content", "other"];

export default function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>("improvement");
  const [message, setMessage] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function close() {
    setOpen(false);
    // 닫을 때 상태 초기화 (약간의 지연으로 애니메이션 여운)
    setTimeout(() => {
      setDone(false);
      setMessage("");
      setEmail("");
      setCategory("improvement");
      setError("");
    }, 200);
  }

  async function handleSubmit() {
    if (!message.trim()) {
      setError("내용을 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    const res = await submitFeedback({ message, category, email: email || undefined });
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
    } else {
      setError("전송에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  return (
    <>
      {/* 플로팅 버튼 */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg transition text-sm font-medium"
          aria-label="개선 제안하기"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          개선 제안
        </button>
      )}

      {/* 모달 */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={close}>
          <div
            className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-purple-900">개선 제안하기</h2>
              <button onClick={close} className="p-1 text-gray-400 hover:text-gray-600" aria-label="닫기">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {done ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-3">🙏</div>
                <p className="text-lg font-bold text-purple-900 mb-1">소중한 의견 감사합니다</p>
                <p className="text-sm text-gray-600 mb-6">보내 주신 제안은 서비스 개선에 참고하겠습니다.</p>
                <button onClick={close} className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition">
                  닫기
                </button>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <p className="text-sm text-gray-600">
                  더 나은 서비스를 위해 개선하고 싶은 점이나 불편했던 점을 자유롭게 남겨 주세요.
                </p>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">유형</label>
                  <div className="grid grid-cols-2 gap-2">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className={`py-2 rounded-lg border text-sm transition ${
                          category === c
                            ? "bg-purple-600 border-purple-600 text-white"
                            : "bg-white border-gray-300 text-gray-700 hover:border-purple-400"
                        }`}
                      >
                        {FEEDBACK_CATEGORY_LABELS[c]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={4}
                    maxLength={2000}
                    placeholder="어떤 점을 개선하면 좋을까요? 구체적으로 적어 주시면 큰 도움이 됩니다."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base resize-none"
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{message.length} / 2000</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    이메일 <span className="text-gray-400 font-normal">(선택 · 답변이 필요하시면)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-base"
                  />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button
                  onClick={handleSubmit}
                  disabled={submitting || !message.trim()}
                  className="w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition"
                >
                  {submitting ? "보내는 중..." : "보내기"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
