// soundary.life(해람헬스케어) 검사 링크 매핑.
// 같은 검사가 soundary에 있으면 목록/카드 링크를 그쪽으로 보낸다.
// (hearam.kr의 검사 페이지 자체는 기존 공유 링크·SEO 보존을 위해 유지)

const SOUNDARY_BASE = "https://soundary.life/ko";
const UTM = "utm_source=hearam.kr";

// /ko/test/{slug} 로 존재하는 검사들 (심리설문 + 집중력·인지)
const SOUNDARY_TEST_SLUGS = new Set([
  // 심리 설문
  "phq9", "cesd", "pss", "asrs", "mdq", "audit",
  "gad7", "pcl5", "who5", "epds", "dass21",
  // 집중력·인지·지능
  "stroop", "selective-attention", "sustained-inhibition", "interference-attention",
  "n-back", "digit-span", "trail-making", "iq",
  "reaction-time", "spatial-span", "task-switching",
]);

// /ko/personality/{slug} 로 존재하는 성격 검사들
const SOUNDARY_PERSONALITY_SLUGS = new Set([
  "big5", "enneagram", "attachment", "disc", "riasec", "schema",
]);

/** 심리설문·집중력·인지 검사: soundary URL (없으면 null) */
export function soundaryTestUrl(slug: string): string | null {
  if (!SOUNDARY_TEST_SLUGS.has(slug)) return null;
  return `${SOUNDARY_BASE}/test/${slug}?${UTM}`;
}

/** 성격 검사: soundary URL (없으면 null) */
export function soundaryPersonalityUrl(slug: string): string | null {
  if (!SOUNDARY_PERSONALITY_SLUGS.has(slug)) return null;
  return `${SOUNDARY_BASE}/personality/${slug}?${UTM}`;
}

/** 종합 성격 보고서(배터리) */
export function soundaryBatteryUrl(): string {
  return `${SOUNDARY_BASE}/personality/battery?${UTM}`;
}

/** 성격 검사 목록 */
export function soundaryPersonalityIndexUrl(): string {
  return `${SOUNDARY_BASE}/personality?${UTM}`;
}
