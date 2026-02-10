"use client";

interface WarningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WarningModal({ isOpen, onClose }: WarningModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md mx-4 bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-purple-100 bg-purple-50">
          <h3 className="text-lg font-semibold text-purple-900">미응답 문항</h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 transition"
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
            className="w-full px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}
