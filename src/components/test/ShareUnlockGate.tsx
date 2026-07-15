"use client";

/**
 * 시행 직후 '간단 결과' 아래에 놓이는 심화 결과 잠금 카드.
 * 공유하면(onUnlock) 상세 해석·그래프 등 심화 결과가 열린다(share-to-unlock).
 */
export default function ShareUnlockGate({
  onUnlock,
  busy = false,
  title = "심화 분석 결과가 잠겨 있어요",
  desc = "결과를 친구에게 공유하면 상세 성격 해석과 강점·관계·성장 가이드, 그래프까지 모두 열립니다.",
}: {
  onUnlock: () => void;
  busy?: boolean;
  title?: string;
  desc?: string;
}) {
  return (
    <div className="bg-gradient-to-br from-purple-600 to-purple-800 text-white rounded-2xl p-6 mb-6 text-center">
      <div className="text-3xl mb-2">🔒</div>
      <p className="text-lg font-bold mb-1">{title}</p>
      <p className="text-sm text-purple-100 leading-relaxed mb-4">{desc}</p>
      <button
        onClick={onUnlock}
        disabled={busy}
        className="w-full px-6 py-3 bg-white text-purple-700 font-bold rounded-xl hover:bg-purple-50 disabled:opacity-60 transition"
      >
        {busy ? "여는 중..." : "공유하고 심화 결과 열기"}
      </button>
      <p className="text-[11px] text-purple-200 mt-2">공유 링크를 복사해 친구에게 보내면 바로 열려요</p>
    </div>
  );
}
