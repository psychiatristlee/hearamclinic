import { SOUNDARY_TEST_CATALOG_URL } from "@/lib/external-tests";

export default function SoundaryBanner({ className = "" }: { className?: string }) {
  return (
    <aside className={`rounded-2xl bg-gradient-to-r from-violet-700 to-indigo-700 p-5 sm:p-6 text-white shadow-lg shadow-violet-900/10 ${className}`}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-violet-100 mb-1">🌊 Soundary · 사운더리</p>
          <h2 className="text-xl font-bold mb-1">심리검사는 이제 사운더리에서 진행합니다</h2>
          <p className="text-sm text-violet-100 leading-relaxed">
            우울·불안·성격·집중력 검사까지 사운더리에서 무료로 받아보세요. 검사 링크를 누르면 이동 안내가 표시됩니다.
          </p>
        </div>
        <a
          href={SOUNDARY_TEST_CATALOG_URL}
          className="shrink-0 rounded-xl bg-white px-5 py-3 text-center text-sm font-bold text-violet-800 hover:bg-violet-50"
        >
          사운더리 검사 둘러보기 ↗
        </a>
      </div>
    </aside>
  );
}
