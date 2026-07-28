// soundary.life(사운더리) — 심리검사 전문 플랫폼으로 이관해 진행하는 검사들.
// 아래 목록의 검사는 hearam.kr에서 안내 문구를 보여준 뒤 Soundary로 연결한다.
// (hearam.kr의 검사 페이지 경로 자체는 SEO·기존 공유 링크 보존을 위해 유지)

const SOUNDARY_BASE = "https://soundary.life/ko";
const UTM = "utm_source=hearam.kr";

// Soundary에서 진행하는 검사 slug → 안내 화면에 쓸 짧은 표시용 제목
// (해람 /test/{slug} → soundary /ko/test/{slug})
const SOUNDARY_TESTS: Record<string, string> = {
  iq: "종합 인지능력 검사 (IQ)",
  stroop: "스트룹 검사",
};

/** 해당 검사가 Soundary에서 진행되면 그 URL을, 아니면 null을 반환한다. */
export function soundaryTestUrl(slug: string): string | null {
  if (!(slug in SOUNDARY_TESTS)) return null;
  return `${SOUNDARY_BASE}/test/${slug}?${UTM}`;
}

/** 안내 화면에 쓸 짧은 표시용 제목 (없으면 undefined) */
export function soundaryTestTitle(slug: string): string | undefined {
  return SOUNDARY_TESTS[slug];
}

/** 해당 검사가 Soundary에서 진행되는지 여부 */
export function isSoundaryTest(slug: string): boolean {
  return slug in SOUNDARY_TESTS;
}
