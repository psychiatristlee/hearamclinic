import {
  INLINE_MIN_SCORE,
  relatedSoundary,
  soundaryCatalogUrl,
  soundaryGuideUrl,
  soundaryPickUrl,
} from "@/lib/soundary-related";

type PostLike = { id: string; title: string; categories: string[]; content: string };

/**
 * 글 머리 아래 한 줄 — "이 글과 관련된 무료 검사". 끝까지 읽지 않는 사람도 바로 갈 수 있게.
 * 관련 검사가 없으면 아무것도 그리지 않는다(머리에 광고처럼 보이는 줄을 억지로 넣지 않는다).
 */
export function SoundaryRelatedInline({ post }: { post: PostLike }) {
  const { tests } = relatedSoundary(post, 1);
  const pick = tests[0];
  if (!pick || pick.score < INLINE_MIN_SCORE) return null;
  return (
    <p className="-mt-4 mb-8 rounded-xl bg-purple-50 px-4 py-3 text-sm text-purple-900">
      <span className="font-semibold">이 글과 관련된 무료 검사</span>
      <span className="mx-1.5 text-purple-300">·</span>
      <a
        href={soundaryPickUrl(pick, post.id)}
        className="font-bold text-purple-700 underline underline-offset-2 hover:text-purple-900"
      >
        {pick.title} ({pick.minutes}분) →
      </a>
    </p>
  );
}

/** 글 끝 카드 — 관련 검사 최대 2개 + 관련 해설 글 1개. 없으면 사운더리 검사 목록으로. */
export function SoundaryRelatedCard({ post }: { post: PostLike }) {
  const { tests, guide } = relatedSoundary(post, 2);
  return (
    <aside className="mt-12 rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-indigo-50 p-5 sm:p-6">
      <p className="mb-1 text-sm font-semibold text-purple-600">🌊 Soundary · 사운더리</p>
      <h2 className="mb-4 text-lg font-bold text-gray-900">
        {tests.length > 0 ? "이 글을 읽으셨다면, 직접 확인해 보세요" : "내 마음 상태, 무료로 확인해 보세요"}
      </h2>
      {tests.length > 0 ? (
        <ul className="space-y-3">
          {tests.map((t) => (
            <li key={t.slug}>
              <a
                href={soundaryPickUrl(t, post.id)}
                className="pressable flex items-center justify-between gap-4 rounded-xl bg-white px-4 py-3.5 shadow-sm ring-1 ring-purple-100 hover:ring-purple-300"
              >
                <span>
                  <span className="block font-bold text-gray-900">{t.title}</span>
                  <span className="mt-0.5 block text-sm text-gray-600">{t.pitch}</span>
                </span>
                <span className="shrink-0 rounded-full bg-purple-600 px-3 py-1.5 text-sm font-bold text-white">
                  {t.minutes}분 · 무료
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <a
          href={soundaryCatalogUrl(post.id)}
          className="pressable inline-block rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white hover:bg-purple-700"
        >
          우울·불안·성격·집중력 검사 둘러보기 →
        </a>
      )}
      {guide && (
        <p className="mt-4 text-sm text-gray-600">
          더 읽어 보기:{" "}
          <a href={soundaryGuideUrl(guide.path, post.id)} className="font-semibold text-purple-700 underline underline-offset-2 hover:text-purple-900">
            {guide.title}
          </a>
        </p>
      )}
      <p className="mt-4 text-xs text-gray-400">
        결과는 선별용이며 진단이 아닙니다. 걱정되는 결과가 나오면 진료로 이어서 상의하세요.
      </p>
    </aside>
  );
}
