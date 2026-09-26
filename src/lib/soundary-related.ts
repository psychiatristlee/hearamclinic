// 블로그 글 → 이 글과 관련된 사운더리(Soundary) 무료 검사·가이드.
//
// 왜: 2026-09 사운더리 유입 분석에서 해람 블로그로 들어온 사람은 검사 완료 76%·가입 38%로
// 모든 채널 중 가장 높았는데, 글 249쪽 중 사운더리로 바로 가는 링크가 있는 곳은 33쪽뿐이었다.
// 검사 주제 글도 해람 소개 페이지(5초 뒤 자동 이동)나 검사 목록을 한 번 더 거쳤다.
// → 글 제목·분류·본문의 낱말로 검사를 골라 글 안에서 바로 보낸다. 글을 고칠 필요가 없다.
//
// 링크에는 글 ID 를 utm_campaign 으로 붙인다 — 어느 글이 사람을 데려오는지 사운더리 GA 에서 본다
// (예전 링크는 utm_source 만 있어서 글별 성과를 알 수 없었다).

export type SoundaryKind = "test" | "personality";

export type SoundaryPick = {
  slug: string;
  kind: SoundaryKind;
  title: string;
  pitch: string;
  minutes: number;
};

type Rule = SoundaryPick & { words: string[] };

/** 글 머리 한 줄은 제목·분류에 걸렸을 때만(6점 이상) — 본문 곁가지 낱말로 머리에 검사를 걸지 않는다. */
export const INLINE_MIN_SCORE = 6;

// 앞쪽 규칙일수록 같은 점수에서 먼저 뽑힌다. 낱말은 소문자 비교(영문)·부분 일치(한글).
const RULES: Rule[] = [
  // 마음건강
  { slug: "phq9", kind: "test", title: "우울 선별검사 (PHQ-9)", pitch: "지난 2주의 기분·수면·식욕·집중을 9문항으로 점검해요.", minutes: 2, words: ["우울", "항우울", "세로토닌", "무기력", "행동활성", "단약"] },
  { slug: "epds", kind: "test", title: "산후 마음 점검", pitch: "출산 전후의 기분 변화를 짧게 확인해요.", minutes: 2, words: ["산후", "출산", "모유", "임신", "산모"] },
  { slug: "mdq", kind: "test", title: "들뜬 기분 점검 (조울 선별)", pitch: "조증·경조증 쪽 신호가 있었는지 14문항으로 살펴봐요.", minutes: 3, words: ["조울", "양극성", "조증", "경조증", "리튬"] },
  { slug: "gad7", kind: "test", title: "불안 자가검사 (GAD-7)", pitch: "지난 2주의 불안·긴장 정도를 7문항으로 봐요.", minutes: 2, words: ["불안", "불안장애", "긴장", "알프라졸람", "자낙스"] },
  { slug: "panic", kind: "test", title: "공황 증상 점검", pitch: "갑작스러운 공황 발작과 예기불안을 점검해요.", minutes: 2, words: ["공황", "예기불안"] },
  { slug: "pcl5", kind: "test", title: "외상후 스트레스 점검 (PCL-5)", pitch: "지나간 사건이 지금도 나를 흔드는지 20문항으로 봐요.", minutes: 4, words: ["ptsd", "외상", "트라우마", "c-ptsd"] },
  { slug: "asrs", kind: "test", title: "성인 ADHD 자가점검", pitch: "주의 유지·정리·충동·시간 감각을 네 갈래로 나눠 봐요.", minutes: 3, words: ["adhd", "주의력결핍", "콘서타", "아토목세틴", "메틸페니데이트", "에더럴", "adderall"] },
  { slug: "focus-battery", kind: "test", title: "주의력 종합검사", pitch: "병원의 컴퓨터 주의력 검사처럼 여러 과제로 집중력을 재요.", minutes: 20, words: ["cat 검사", "주의력 검사", "전산화", "집중력 검사"] },
  { slug: "focus-obstacles", kind: "test", title: "일상 집중 방해요인 점검", pitch: "내 집중을 끊는 것이 무엇인지 9문항으로 찾아요.", minutes: 2, words: ["집중력", "집중이 안", "브레인 포그", "몰입", "팝콘 브레인", "숏폼", "디지털 과잉", "디지털 디톡스", "도파민 리셋", "지루함", "산만"] },
  { slug: "task-switching", kind: "test", title: "두뇌 회전 테스트 (과제 전환)", pitch: "일을 바꿀 때 드는 '전환 비용'을 직접 재 봐요.", minutes: 3, words: ["멀티태스킹", "전환 비용", "과제 전환"] },
  { slug: "sleep", kind: "test", title: "수면 건강 점검", pitch: "잠드는 데·깨는 데·낮 컨디션까지 10문항으로 봐요.", minutes: 2, words: ["수면", "불면", "숙면", "멜라토닌", "트라조돈", "졸피뎀", "취침", "무호흡", "기면", "과수면", "잠 못", "시차증", "렘"] },
  { slug: "fatigue", kind: "test", title: "피로 네 갈래 점검", pitch: "몸·마음·집중·의욕 중 어디가 지쳤는지 나눠 봐요.", minutes: 3, words: ["피로", "피곤", "교대 근무"] },
  { slug: "cbi", kind: "test", title: "번아웃 검사 (코펜하겐 척도)", pitch: "개인·일·관계 세 영역의 소진 정도를 봐요.", minutes: 4, words: ["번아웃", "소진"] },
  { slug: "pss", kind: "test", title: "스트레스 체감 점검", pitch: "요즘 느끼는 압박과 통제감을 짧게 확인해요.", minutes: 2, words: ["스트레스"] },
  { slug: "audit", kind: "test", title: "음주 습관 자가점검", pitch: "마시는 양과 빈도, 문제 신호를 10문항으로 봐요.", minutes: 3, words: ["알코올", "음주", "술자리", "과음", "폭음"] },
  { slug: "gaming", kind: "test", title: "게임 과몰입 점검", pitch: "게임이 일상을 얼마나 차지하는지 확인해요.", minutes: 2, words: ["게임"] },
  { slug: "sns-overuse", kind: "test", title: "소셜미디어 과의존 점검", pitch: "SNS를 끊으면 불안한지, 얼마나 빠져 있는지 봐요.", minutes: 3, words: ["sns", "소셜 미디어", "소셜미디어", "인스타"] },
  { slug: "sassv", kind: "test", title: "스마트폰 과의존 점검", pitch: "스마트폰 사용이 일상에 주는 영향을 10문항으로 봐요.", minutes: 2, words: ["스마트폰", "도파민 중독", "휴대폰"] },
  { slug: "perfectionism", kind: "test", title: "완벽주의 척도", pitch: "나를 밀어주는 완벽주의인지, 괴롭히는 완벽주의인지 나눠 봐요.", minutes: 3, words: ["완벽주의", "가면 증후군", "사기꾼"] },
  { slug: "self-compassion", kind: "test", title: "자기다정 점검", pitch: "힘들 때 나를 대하는 방식을 살펴봐요.", minutes: 3, words: ["내면의 비판자", "자기비판", "자기 비판", "자책"] },
  { slug: "rses", kind: "test", title: "자존감 검사 (로젠버그)", pitch: "나를 얼마나 괜찮은 사람으로 느끼는지 10문항으로 봐요.", minutes: 2, words: ["자존감", "자기가치"] },
  { slug: "loneliness", kind: "test", title: "외로움 점검", pitch: "정서적·사회적 외로움을 나눠서 봐요.", minutes: 2, words: ["외로움", "고독", "관계 맺기", "혼자가 편한"] },
  { slug: "procrastination-style", kind: "personality", title: "미루기 유형 검사", pitch: "왜 미루는지 — 나의 미루기 유형을 찾아요.", minutes: 3, words: ["미루", "지연행동", "게으름"] },
  { slug: "eating", kind: "test", title: "섭식 태도 점검", pitch: "먹는 방식과 음식·체중에 대한 마음을 살펴봐요.", minutes: 2, words: ["폭식", "식사", "다이어트", "체중", "요요", "오르토렉시아", "위고비", "마운자로", "삭센다", "glp-1", "섭식", "식욕"] },
  { slug: "emotion-regulation", kind: "test", title: "정서조절 전략 점검", pitch: "감정을 다루는 나의 방식(재평가·억제)을 봐요.", minutes: 3, words: ["감정 조절", "감정조절", "감정적 과부하", "감정 관리", "메타센싱", "경계선"] },
  { slug: "sensitivity", kind: "personality", title: "HSP 테스트 (초예민자 자가검사)", pitch: "나의 민감성을 여섯 영역과 세 유형으로 봐요.", minutes: 4, words: ["hsp", "민감한 사람", "예민", "초민감", "섬세함"] },
  { slug: "irrational-beliefs", kind: "personality", title: "비합리적 신념 검사 (REBT)", pitch: "'반드시·끔찍해·못 견뎌' — 감정을 키우는 생각 습관을 봐요.", minutes: 3, words: ["인지왜곡", "인지행동치료", "cbt", "생각이 감정", "rebt", "엘리스"] },
  { slug: "rumination", kind: "test", title: "반추 척도", pitch: "같은 생각을 곱씹는 습관이 얼마나 강한지 봐요.", minutes: 3, words: ["반추", "곱씹", "되새김"] },
  { slug: "ocd", kind: "test", title: "강박 증상 점검", pitch: "원치 않는 생각과 반복 행동을 점검해요.", minutes: 3, words: ["강박"] },
  { slug: "phq15", kind: "test", title: "신체증상 점검 (PHQ-15)", pitch: "마음이 몸으로 나타나는 증상을 15문항으로 봐요.", minutes: 4, words: ["신체화", "신체 증상", "몸이 아픈데"] },
  { slug: "anger", kind: "test", title: "분노 조절 점검", pitch: "화가 올라오는 속도와 다루는 방식을 봐요.", minutes: 2, words: ["분노", "화를", "욱하", "울화"] },
  { slug: "social-anxiety", kind: "test", title: "사회불안 점검", pitch: "사람 앞에서의 긴장과 회피를 점검해요.", minutes: 2, words: ["사회불안", "대인공포", "무대공포"] },
  { slug: "mindfulness", kind: "test", title: "마음챙김 척도", pitch: "지금 여기에 머무는 힘을 10문항으로 봐요.", minutes: 3, words: ["마음챙김", "명상"] },
  { slug: "test-anxiety", kind: "test", title: "시험불안 점검", pitch: "시험 앞에서의 걱정·몸 긴장·회피를 봐요.", minutes: 3, words: ["시험불안", "시험 불안", "수험", "수능"] },
  { slug: "parenting-stress", kind: "test", title: "양육 스트레스 점검", pitch: "육아로 쌓인 부담을 짧게 확인해요.", minutes: 3, words: ["양육", "육아"] },
  { slug: "approval-need", kind: "personality", title: "인정 욕구 테스트", pitch: "칭찬받고 싶은 마음과 미움받기 싫은 마음을 나눠 봐요.", minutes: 2, words: ["공의존", "인정 욕구", "눈치"] },
  { slug: "dark-triad", kind: "personality", title: "다크 트라이어드", pitch: "마키아벨리즘·나르시시즘·사이코패시 성향을 봐요.", minutes: 2, words: ["싸이코패스", "사이코패스", "사이코패시", "반사회성", "나르시시즘"] },
  { slug: "nicotine", kind: "test", title: "니코틴 의존 점검", pitch: "담배·전자담배 의존 정도를 봐요.", minutes: 3, words: ["니코틴", "담배", "금연"] },
  { slug: "gambling", kind: "test", title: "도박 문제 선별", pitch: "도박 습관의 위험 신호를 9문항으로 봐요.", minutes: 2, words: ["도박"] },
  { slug: "invest-style", kind: "test", title: "투자성향 유형 검사", pitch: "나의 투자 위험 감수 수준을 5유형으로 봐요.", minutes: 2, words: ["주식", "투자자", "투자 성과", "투자 성향", "재테크", "코인"] },
  // 성격·진로
  { slug: "big5", kind: "personality", title: "Big5 성격검사", pitch: "외향성·성실성 등 다섯 차원으로 나를 봐요 (약 6분).", minutes: 6, words: ["big 5", "big5", "5요인", "빅파이브", "성실성", "기질과 성격", "성격을 측정"] },
  { slug: "sixteen-types", kind: "personality", title: "성격유형 나침반 (16유형)", pitch: "INFP·ENTJ 식 네 글자로 보는 성격 유형 (MBTI 아님).", minutes: 7, words: ["mbti"] },
  { slug: "enneagram", kind: "personality", title: "에니어그램 성격 검사", pitch: "아홉 유형과 날개로 마음의 동기를 봐요.", minutes: 6, words: ["에니어그램"] },
  { slug: "disc", kind: "personality", title: "DISC 행동유형 검사", pitch: "주도·사교·안정·신중 — 일할 때의 내 행동 양식.", minutes: 4, words: ["disc"] },
  { slug: "attachment", kind: "personality", title: "애착 유형 검사", pitch: "연애·관계에서 반복되는 패턴을 불안·회피 두 축으로 봐요.", minutes: 4, words: ["애착", "볼비", "연애 패턴", "관계 패턴"] },
  { slug: "riasec", kind: "personality", title: "직업흥미 검사 (RIASEC)", pitch: "홀랜드 6유형으로 나에게 맞는 진로 방향을 봐요.", minutes: 5, words: ["riasec", "직업흥미", "진로", "홀랜드"] },
  { slug: "schema", kind: "personality", title: "심리도식 검사", pitch: "18가지 도식으로 마음의 오래된 무늬를 읽어요.", minutes: 6, words: ["심리도식", "초기부적응", "도식"] },
  // 인지
  { slug: "stroop", kind: "test", title: "스트룹 검사", pitch: "색과 글자가 부딪힐 때 뇌의 억제력을 재 봐요.", minutes: 3, words: ["스트룹", "stroop"] },
  { slug: "n-back", kind: "test", title: "N-back 작업기억 검사", pitch: "방금 본 것을 붙잡고 비교하는 작업기억을 재요.", minutes: 2, words: ["n-back", "작업기억", "워킹메모리"] },
  { slug: "digit-span", kind: "test", title: "숫자 폭 검사", pitch: "한 번에 기억하는 숫자의 길이를 재요.", minutes: 3, words: ["숫자 폭", "기억력", "기억의", "해마"] },
  { slug: "trail-making", kind: "test", title: "궤적 잇기 검사", pitch: "숫자·글자를 번갈아 잇는 속도로 전환 능력을 봐요.", minutes: 3, words: ["궤적 잇기", "trail making"] },
  { slug: "selective-attention", kind: "test", title: "선택 주의력 검사", pitch: "많은 자극 가운데 목표만 골라내는 힘을 재요.", minutes: 3, words: ["선택 주의"] },
  { slug: "sustained-inhibition", kind: "test", title: "억제지속 주의력 (Go/No-Go)", pitch: "눌러야 할 때와 멈춰야 할 때를 가르는 힘을 재요.", minutes: 4, words: ["go/no-go", "억제지속", "충동"] },
  { slug: "interference-attention", kind: "test", title: "간섭선택 주의력 (Flanker)", pitch: "주변 방해를 무시하고 목표에 집중하는 힘을 재요.", minutes: 3, words: ["flanker", "간섭선택"] },
  { slug: "iq", kind: "test", title: "종합 인지능력 검사 (IQ)", pitch: "언어·수리·도형·기억·속도 다섯 영역 (약 20분).", minutes: 20, words: ["지능검사", "지능이", "지능 지수", "iq", "난독"] },
];

// 사운더리 가이드(해설 글) — 머리 검색어(스트룹·Big5·ADHD…)의 순위는 들어오는 링크로 쌓인다.
const GUIDES: { path: string; title: string; words: string[] }[] = [
  { path: "stroop-effect", title: "스트룹 효과란? 원리와 간섭 점수 읽는 법", words: ["스트룹", "stroop"] },
  { path: "big5-explained", title: "빅파이브 성격검사 완전 정리", words: ["big 5", "big5", "5요인", "빅파이브", "성실성"] },
  { path: "adult-adhd-diagnosis", title: "성인 ADHD 진단, 어떻게 받나", words: ["adhd"] },
  { path: "depression-self-test-guide", title: "우울증 자가진단 점수 해석법 (PHQ-9)", words: ["우울"] },
  { path: "attachment-styles", title: "애착 유형 4가지와 연애 패턴", words: ["애착"] },
  { path: "burnout-signs", title: "번아웃과 우울증의 차이", words: ["번아웃", "소진"] },
  { path: "anxiety-vs-panic", title: "불안장애와 공황장애, 어떻게 다를까", words: ["공황", "불안"] },
  { path: "bipolar-1-vs-2", title: "양극성 장애 1형과 2형의 차이", words: ["양극성", "조울", "조증"] },
  { path: "iq-score-distribution", title: "IQ 점수 분포와 백분위 읽는 법", words: ["지능검사", "지능이", "지능 지수", "iq"] },
  { path: "working-memory-training", title: "작업기억이란? n-back 훈련은 효과가 있을까", words: ["작업기억", "n-back", "기억력"] },
  { path: "bring-results-to-clinic", title: "자가검사 결과, 진료실에 어떻게 가져갈까", words: ["초진", "정신과 처음", "좋은 정신과", "정신과 찾는"] },
];

function count(hay: string, word: string): number {
  let n = 0;
  let i = hay.indexOf(word);
  while (i !== -1) {
    n++;
    i = hay.indexOf(word, i + word.length);
  }
  return n;
}

/**
 * 제목 한 번 = 6점, 분류 = 3점, 본문 = 1점(낱말당 최대 4). 3점 미만은 관련 없음.
 * 낱말은 부분 일치라 짧은 낱말이 다른 말 속에 숨는다 — 「화가」⊂「변화가」, 「술을」⊂「수술을」,
 * 「투자」⊂「정신건강에 투자」가 실제로 엉뚱한 검사를 불렀다(211편 전수 점검). 낱말을 넣을 때 확인할 것.
 */
function score(words: string[], title: string, cats: string, body: string): number {
  let s = 0;
  for (const w of words) {
    if (title.includes(w)) s += 6;
    if (cats.includes(w)) s += 3;
    s += Math.min(4, count(body, w));
  }
  return s;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ");
}

export function relatedSoundary(post: { title: string; categories: string[]; content: string }, max = 2) {
  const title = norm(post.title);
  const cats = norm(post.categories.join(" "));
  // 링크·이미지 주소 속 낱말까지 세지 않게 URL 은 지운다.
  const body = norm(post.content.replace(/\((https?:[^)]*)\)/g, " ").replace(/https?:\/\/\S+/g, " "));
  const tests = RULES.map((r, i) => ({ r, i, s: score(r.words, title, cats, body) }))
    .filter((x) => x.s >= 3)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, max)
    .map(({ r, s }) => ({ slug: r.slug, kind: r.kind, title: r.title, pitch: r.pitch, minutes: r.minutes, score: s }));
  const guide = GUIDES.map((g, i) => ({ g, i, s: score(g.words, title, cats, body) }))
    .filter((x) => x.s >= 6)
    .sort((a, b) => b.s - a.s || a.i - b.i)[0]?.g;
  return { tests, guide: guide ? { path: guide.path, title: guide.title } : null };
}

function utm(campaign: string): string {
  return `utm_source=hearam.kr&utm_medium=blog&utm_campaign=${encodeURIComponent(campaign)}`;
}

export function soundaryPickUrl(pick: Pick<SoundaryPick, "slug" | "kind">, postId: string): string {
  return `https://soundary.life/ko/${pick.kind}/${pick.slug}?${utm(`post-${postId}`)}`;
}

export function soundaryGuideUrl(path: string, postId: string): string {
  return `https://soundary.life/ko/guide/${path}?${utm(`post-${postId}`)}`;
}

export function soundaryCatalogUrl(postId: string): string {
  return `https://soundary.life/ko/test?${utm(`post-${postId}`)}`;
}
