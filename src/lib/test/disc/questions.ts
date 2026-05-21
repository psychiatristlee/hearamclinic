export type DiscDimension = "D" | "I" | "S" | "C";

export interface DiscQuestion {
  id: number;
  dimension: DiscDimension;
  text: string;
}

// 각 차원당 6문항 × 4차원 = 24문항. 모두 정채점 (1=전혀 그렇지 않다 ~ 5=매우 그렇다)
const QUESTIONS: DiscQuestion[] = [
  // D — 주도형 (Dominance)
  { id: 1, dimension: "D", text: "결정을 빠르게 내리고 일을 추진하는 편이다." },
  { id: 2, dimension: "D", text: "도전적인 목표를 좋아한다." },
  { id: 3, dimension: "D", text: "상황을 통제하고 주도하는 자리가 편하다." },
  { id: 4, dimension: "D", text: "결과를 빠르게 만들어 내는 것이 중요하다." },
  { id: 5, dimension: "D", text: "장애물을 만나도 정면으로 부딪쳐 해결한다." },
  { id: 6, dimension: "D", text: "직설적으로 의견을 말하는 편이다." },

  // I — 사교형 (Influence)
  { id: 7, dimension: "I", text: "처음 만나는 사람과도 쉽게 친해진다." },
  { id: 8, dimension: "I", text: "분위기를 띄우고 사람들을 즐겁게 하는 것을 좋아한다." },
  { id: 9, dimension: "I", text: "긍정적이고 낙관적인 편이다." },
  { id: 10, dimension: "I", text: "감정을 풍부하게 표현한다." },
  { id: 11, dimension: "I", text: "여러 사람과 어울리며 에너지를 얻는다." },
  { id: 12, dimension: "I", text: "이야기로 다른 사람을 설득하는 것을 좋아한다." },

  // S — 안정형 (Steadiness)
  { id: 13, dimension: "S", text: "변화보다 안정된 환경이 편하다." },
  { id: 14, dimension: "S", text: "다른 사람의 이야기를 끝까지 인내심 있게 들어준다." },
  { id: 15, dimension: "S", text: "팀의 화합과 협력을 중요하게 여긴다." },
  { id: 16, dimension: "S", text: "맡은 일은 꾸준히 끝까지 마무리한다." },
  { id: 17, dimension: "S", text: "갈등 상황에서는 한발 물러나 중재하는 편이다." },
  { id: 18, dimension: "S", text: "오랜 친구·동료와의 관계를 깊게 가꾼다." },

  // C — 신중형 (Conscientiousness)
  { id: 19, dimension: "C", text: "일을 시작하기 전에 자료와 사실을 충분히 분석한다." },
  { id: 20, dimension: "C", text: "정확성과 완성도를 중요하게 여긴다." },
  { id: 21, dimension: "C", text: "체계적인 규칙과 절차를 따르는 것이 편하다." },
  { id: 22, dimension: "C", text: "세부 사항을 놓치지 않으려고 꼼꼼히 확인한다." },
  { id: 23, dimension: "C", text: "감정보다 논리와 근거로 판단하려고 한다." },
  { id: 24, dimension: "C", text: "결정 전에 가능한 모든 변수를 점검한다." },
];

export default QUESTIONS;

export const LIKERT_LABELS = [
  "전혀 그렇지 않다",
  "그렇지 않다",
  "보통이다",
  "그렇다",
  "매우 그렇다",
];
