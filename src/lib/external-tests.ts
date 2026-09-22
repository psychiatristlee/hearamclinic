// 해람의 검사 진입 경로를 유지하면서, 새 검사는 사운더리에서 진행한다.

const SOUNDARY_TEST_TITLES: Record<string, string> = {
  phq9: "우울증 선별검사 (PHQ-9)",
  cesd: "우울 자가 점검",
  pss: "스트레스 자가 점검",
  asrs: "성인 ADHD 자가 점검",
  mdq: "들뜬 기분 점검",
  audit: "음주 습관 자가 점검",
  gad7: "불안 자가 점검 (GAD-7)",
  pcl5: "외상후 스트레스 자가 점검 (PCL-5)",
  who5: "일상 활력 지수",
  epds: "산후 마음 점검",
  dass21: "우울·불안·스트레스 점검",
  iq: "종합 인지능력 검사 (IQ)",
  stroop: "스트룹 검사",
  "selective-attention": "선택 주의력 검사",
  "sustained-inhibition": "억제지속 주의력 검사",
  "interference-attention": "간섭선택 주의력 검사",
  "n-back": "N-back 검사",
  "digit-span": "숫자 폭 검사",
  "trail-making": "궤적 잇기 검사",
  "reaction-time": "반응속도 테스트",
  "spatial-span": "공간 기억력 테스트",
  "task-switching": "두뇌 회전 테스트",
};

const SOUNDARY_PERSONALITY_TITLES: Record<string, string> = {
  big5: "Big 5 성격 검사",
  enneagram: "에니어그램 성격 검사",
  attachment: "애착 유형 검사",
  disc: "DISC 행동 유형 검사",
  riasec: "직업흥미 검사",
  schema: "심리도식 검사",
};

function hasTest(tests: Record<string, string>, slug: string): boolean {
  return Object.prototype.hasOwnProperty.call(tests, slug);
}

export function soundaryTestUrl(slug: string): string | null {
  return hasTest(SOUNDARY_TEST_TITLES, slug)
    ? `https://soundary.life/ko/test/${slug}?utm_source=hearam.kr`
    : null;
}

export function soundaryTestTitle(slug: string): string | undefined {
  return SOUNDARY_TEST_TITLES[slug];
}

export function isSoundaryTest(slug: string): boolean {
  return hasTest(SOUNDARY_TEST_TITLES, slug);
}

export function soundaryPersonalityUrl(slug: string): string | null {
  return hasTest(SOUNDARY_PERSONALITY_TITLES, slug)
    ? `https://soundary.life/ko/personality/${slug}?utm_source=hearam.kr`
    : null;
}

export function soundaryPersonalityTitle(slug: string): string | undefined {
  return SOUNDARY_PERSONALITY_TITLES[slug];
}

export const SOUNDARY_TEST_CATALOG_URL = "https://soundary.life/ko/test?utm_source=hearam.kr";
