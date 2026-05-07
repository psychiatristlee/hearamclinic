export type Big5Dimension = "O" | "C" | "E" | "A" | "N";

export interface Big5Question {
  id: number;
  text: string;
  dimension: Big5Dimension;
  reverse: boolean;
}

// IPIP-NEO 기반 40문항 (각 차원당 8문항, 정채점 5 + 역채점 3)
const QUESTIONS: Big5Question[] = [
  // O — 개방성 (Openness)
  { id: 1, dimension: "O", reverse: false, text: "새로운 아이디어와 개념을 탐구하기를 좋아한다." },
  { id: 2, dimension: "O", reverse: false, text: "예술, 음악, 문학에 깊이 빠지는 편이다." },
  { id: 3, dimension: "O", reverse: false, text: "상상력이 풍부하다." },
  { id: 4, dimension: "O", reverse: false, text: "다양한 관점에서 사물을 보려고 한다." },
  { id: 5, dimension: "O", reverse: false, text: "철학적인 토론을 즐긴다." },
  { id: 6, dimension: "O", reverse: true, text: "추상적인 개념을 다루는 것에 흥미가 없다." },
  { id: 7, dimension: "O", reverse: true, text: "익숙하고 검증된 방식을 더 선호한다." },
  { id: 8, dimension: "O", reverse: true, text: "예술이나 문학적 표현에 관심이 적다." },

  // C — 성실성 (Conscientiousness)
  { id: 9, dimension: "C", reverse: false, text: "일을 시작하기 전에 미리 계획을 세운다." },
  { id: 10, dimension: "C", reverse: false, text: "주변을 정리정돈하는 편이다." },
  { id: 11, dimension: "C", reverse: false, text: "맡은 일은 끝까지 책임지고 마친다." },
  { id: 12, dimension: "C", reverse: false, text: "세부 사항에 주의를 기울인다." },
  { id: 13, dimension: "C", reverse: false, text: "정해진 일정과 마감을 잘 지킨다." },
  { id: 14, dimension: "C", reverse: true, text: "물건을 자주 잃어버리거나 정리되지 않은 채로 둔다." },
  { id: 15, dimension: "C", reverse: true, text: "해야 할 일을 미루는 편이다." },
  { id: 16, dimension: "C", reverse: true, text: "충동적으로 일을 결정한다." },

  // E — 외향성 (Extraversion)
  { id: 17, dimension: "E", reverse: false, text: "모임의 중심에서 활동하는 것을 즐긴다." },
  { id: 18, dimension: "E", reverse: false, text: "처음 만나는 사람과도 쉽게 대화를 시작한다." },
  { id: 19, dimension: "E", reverse: false, text: "활기차고 에너지가 넘친다." },
  { id: 20, dimension: "E", reverse: false, text: "사람들과 어울리며 에너지를 얻는다." },
  { id: 21, dimension: "E", reverse: false, text: "다양한 사람과 폭넓게 교류한다." },
  { id: 22, dimension: "E", reverse: true, text: "혼자 있는 시간이 많이 필요하다." },
  { id: 23, dimension: "E", reverse: true, text: "낯선 사람들 앞에서는 조용한 편이다." },
  { id: 24, dimension: "E", reverse: true, text: "큰 모임보다 한두 명과 깊은 대화를 선호한다." },

  // A — 친화성 (Agreeableness)
  { id: 25, dimension: "A", reverse: false, text: "다른 사람의 감정에 쉽게 공감한다." },
  { id: 26, dimension: "A", reverse: false, text: "어려움에 처한 사람을 도우려 한다." },
  { id: 27, dimension: "A", reverse: false, text: "다른 사람의 입장을 먼저 고려한다." },
  { id: 28, dimension: "A", reverse: false, text: "갈등 상황에서 화해를 시도한다." },
  { id: 29, dimension: "A", reverse: false, text: "타인의 좋은 면을 보려고 한다." },
  { id: 30, dimension: "A", reverse: true, text: "다른 사람과 경쟁하는 것을 좋아한다." },
  { id: 31, dimension: "A", reverse: true, text: "사람들의 의도를 의심하는 편이다." },
  { id: 32, dimension: "A", reverse: true, text: "내 주장을 굽히기 어렵다." },

  // N — 신경성 (Neuroticism, 정서적 불안정성)
  { id: 33, dimension: "N", reverse: false, text: "사소한 일에도 쉽게 스트레스를 받는다." },
  { id: 34, dimension: "N", reverse: false, text: "걱정과 불안을 자주 느낀다." },
  { id: 35, dimension: "N", reverse: false, text: "기분의 기복이 큰 편이다." },
  { id: 36, dimension: "N", reverse: false, text: "예민해서 작은 일에도 마음이 흔들린다." },
  { id: 37, dimension: "N", reverse: false, text: "이미 지난 일을 자주 곱씹는다." },
  { id: 38, dimension: "N", reverse: true, text: "스트레스 상황에서도 침착함을 유지한다." },
  { id: 39, dimension: "N", reverse: true, text: "감정이 안정적이다." },
  { id: 40, dimension: "N", reverse: true, text: "예기치 못한 상황에서도 흔들림이 적다." },
];

export default QUESTIONS;

export const DIMENSION_LABELS: Record<Big5Dimension, { short: string; ko: string; en: string }> = {
  O: { short: "O", ko: "개방성", en: "Openness" },
  C: { short: "C", ko: "성실성", en: "Conscientiousness" },
  E: { short: "E", ko: "외향성", en: "Extraversion" },
  A: { short: "A", ko: "친화성", en: "Agreeableness" },
  N: { short: "N", ko: "정서 민감성", en: "Neuroticism" },
};

export const LIKERT_LABELS = [
  "전혀 그렇지 않다",
  "그렇지 않다",
  "보통이다",
  "그렇다",
  "매우 그렇다",
];
