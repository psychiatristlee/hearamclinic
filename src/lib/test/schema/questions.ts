// 심리도식 검사 — 제프리 영(J. Young)의 초기부적응도식 이론에 기반해
// 해람정신건강의학과가 자체 개발한 무료 자가검사. 특정 상용·공인 검사의
// 문항을 사용하지 않으며, 모든 문항은 이론 개념만 참고해 새로 창작했다.

export type SchemaDomain = "DR" | "IA" | "IL" | "OD" | "OI";

export interface SchemaQuestion {
  id: number;
  schemaId: number; // 1~18
  domain: SchemaDomain;
  text: string;
}

// 18도식 × 2문항 = 36문항. 모두 정채점 (1=전혀 그렇지 않다 ~ 5=매우 그렇다)
const QUESTIONS: SchemaQuestion[] = [
  // 1. 유기/불안정 (DR)
  { id: 1, schemaId: 1, domain: "DR", text: "나는 가까운 사람이 언젠가 나를 떠날까 봐 늘 마음을 놓지 못한다" },
  { id: 2, schemaId: 1, domain: "DR", text: "소중한 관계일수록 헤어지게 될 것 같아 불안해진다" },
  // 2. 불신/학대 (DR)
  { id: 3, schemaId: 2, domain: "DR", text: "사람들이 결국 나를 이용하거나 속일 것 같아 쉽게 믿지 못한다" },
  { id: 4, schemaId: 2, domain: "DR", text: "누군가 나에게 잘해주면 무슨 속셈이 있는 건 아닌지 경계하게 된다" },
  // 3. 정서적 결핍 (DR)
  { id: 5, schemaId: 3, domain: "DR", text: "내가 정말 필요로 하는 사랑과 이해를 받은 적이 거의 없다고 느낀다" },
  { id: 6, schemaId: 3, domain: "DR", text: "아무리 가까운 사이여도 내 마음을 온전히 알아주는 사람은 없는 것 같다" },
  // 4. 결함/수치심 (DR)
  { id: 7, schemaId: 4, domain: "DR", text: "나에게는 남들에게 들키면 안 될 근본적인 결점이 있다고 느낀다" },
  { id: 8, schemaId: 4, domain: "DR", text: "사람들이 진짜 내 모습을 알게 되면 나를 떠날 것 같아 두렵다" },
  // 5. 사회적 고립/소외 (DR)
  { id: 9, schemaId: 5, domain: "DR", text: "나는 어느 곳에서도 잘 어울리지 못하고 겉도는 느낌이 든다" },
  { id: 10, schemaId: 5, domain: "DR", text: "사람들 속에 있어도 나만 다른 세상에 있는 것처럼 동떨어져 있다고 느낀다" },
  // 6. 의존/무능감 (IA)
  { id: 11, schemaId: 6, domain: "IA", text: "나는 누군가의 도움 없이는 일상적인 일도 혼자 해내기 어렵다고 느낀다" },
  { id: 12, schemaId: 6, domain: "IA", text: "스스로 중요한 결정을 내려야 할 때면 감당하기 어려워 막막해진다" },
  // 7. 위험/질병에 대한 취약성 (IA) — 저작권 검증 반영 대체 문항
  { id: 13, schemaId: 7, domain: "IA", text: "평범한 하루에도 나쁜 일이 닥칠까 봐 미리 대비하게 된다" },
  { id: 14, schemaId: 7, domain: "IA", text: "작은 이상 신호에도 큰일이 날 것 같아 쉽게 안심하지 못한다" },
  // 8. 융합/미발달된 자기 (IA)
  { id: 15, schemaId: 8, domain: "IA", text: "나는 부모나 가까운 사람과 너무 얽혀 있어 나만의 삶이 없는 것 같다" },
  { id: 16, schemaId: 8, domain: "IA", text: "가까운 사람과 떨어지면 내가 누구인지조차 잘 모르겠고 공허해진다" },
  // 9. 실패 (IA)
  { id: 17, schemaId: 9, domain: "IA", text: "나는 또래나 주변 사람들에 비해 근본적으로 부족하다고 느낀다" },
  { id: 18, schemaId: 9, domain: "IA", text: "무엇을 시도해도 결국 제대로 해내지 못하고 실패할 것 같다" },
  // 10. 특권의식/과대성 (IL) — 저작권 재검증 반영 대체 문항
  { id: 19, schemaId: 10, domain: "IL", text: "내 방식이 옳으면 정해진 절차쯤은 건너뛰어도 된다고 느낀다" },
  { id: 20, schemaId: 10, domain: "IL", text: "내가 원하는 것은 다른 사람의 사정보다 우선되어야 한다고 생각한다" },
  // 11. 부족한 자기통제 (IL)
  { id: 21, schemaId: 11, domain: "IL", text: "하고 싶은 것을 참거나 미루는 일이 나에게는 무척 힘들다" },
  { id: 22, schemaId: 11, domain: "IL", text: "지루하거나 불편한 일은 끝까지 해내지 못하고 쉽게 그만두게 된다" },
  // 12. 복종 (OD)
  { id: 23, schemaId: 12, domain: "OD", text: "다른 사람과 부딪히지 않으려고 내 생각이나 감정을 자주 숨긴다" },
  { id: 24, schemaId: 12, domain: "OD", text: "상대가 화내거나 나를 멀리할까 봐 내 뜻을 접고 맞춰주게 된다" },
  // 13. 자기희생 (OD)
  { id: 25, schemaId: 13, domain: "OD", text: "내 필요보다 다른 사람의 필요를 먼저 챙기다 정작 나를 돌보지 못한다" },
  { id: 26, schemaId: 13, domain: "OD", text: "다른 사람이 힘들어하면 내 일을 제쳐두고서라도 도와야 마음이 편하다" },
  // 14. 승인추구/인정추구 (OD)
  { id: 27, schemaId: 14, domain: "OD", text: "나의 가치는 다른 사람의 인정이나 칭찬을 받을 때 비로소 느껴진다" },
  { id: 28, schemaId: 14, domain: "OD", text: "남들에게 어떻게 보이는지가 내 진짜 마음보다 더 신경 쓰인다" },
  // 15. 부정성/비관주의 (OI) — 저작권 재검증 반영 대체 문항
  { id: 29, schemaId: 15, domain: "OI", text: "좋은 일이 생기면 기뻐하기보다 대가를 치르게 될까 먼저 계산한다" },
  { id: 30, schemaId: 15, domain: "OI", text: "어떤 일을 앞두면 잘 풀릴 가능성보다 잘못될 가능성이 먼저 떠오른다" },
  // 16. 정서적 억제 (OI)
  { id: 31, schemaId: 16, domain: "OI", text: "나는 기쁨이나 슬픔 같은 감정을 겉으로 잘 드러내지 못한다" },
  { id: 32, schemaId: 16, domain: "OI", text: "감정을 솔직하게 표현하면 어색하거나 부끄러워서 억누르게 된다" },
  // 17. 엄격한 기준/과잉비판 (OI)
  { id: 33, schemaId: 17, domain: "OI", text: "나는 스스로에게 높은 기준을 세우고 웬만해서는 만족하지 못한다" },
  { id: 34, schemaId: 17, domain: "OI", text: "충분히 잘했더라도 부족한 점이 먼저 보여 자신을 몰아붙이게 된다" },
  // 18. 처벌 (OI) — 저작권 검증 반영 대체 문항
  { id: 35, schemaId: 18, domain: "OI", text: "실수한 뒤엔 그냥 넘기지 못하고 어떻게든 갚아야 한다는 압박을 느낀다" },
  { id: 36, schemaId: 18, domain: "OI", text: "나 자신이나 잘못한 사람에게 쉽게 관대해지지 못하고 엄격해진다" },
];

export default QUESTIONS;

export const LIKERT_LABELS = [
  "전혀 그렇지 않다",
  "그렇지 않다",
  "보통이다",
  "그렇다",
  "매우 그렇다",
];

// 결과 시각화·정렬에 쓰는 5개 도식영역 순서
export const DOMAIN_ORDER: SchemaDomain[] = ["DR", "IA", "IL", "OD", "OI"];
