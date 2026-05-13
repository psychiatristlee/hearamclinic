export type AttachmentDimension = "anxiety" | "avoidance";

export interface AttachmentQuestion {
  id: number;
  dimension: AttachmentDimension;
  text: string;
  reverse: boolean;
}

// ECR-R 기반 24문항 (불안 12 + 회피 12)
const QUESTIONS: AttachmentQuestion[] = [
  // 불안 (Anxiety) — 가까운 사람에게 거절·유기당할까 봐 두려워하는 정도
  { id: 1, dimension: "anxiety", reverse: false, text: "가까운 사람이 나를 사랑하지 않을까 봐 자주 걱정한다." },
  { id: 2, dimension: "anxiety", reverse: false, text: "상대방의 마음을 자주 확인하고 싶어진다." },
  { id: 3, dimension: "anxiety", reverse: false, text: "연락이 늦으면 마음이 무거워진다." },
  { id: 4, dimension: "anxiety", reverse: false, text: "상대가 조금만 거리를 두어도 곧 떠날 것 같은 두려움이 든다." },
  { id: 5, dimension: "anxiety", reverse: false, text: "관계가 끝나지 않을까 자주 신경 쓴다." },
  { id: 6, dimension: "anxiety", reverse: false, text: "내 마음을 충분히 전하지 못하면 마음이 불편하다." },
  { id: 7, dimension: "anxiety", reverse: false, text: "가까워질수록 더 많은 확신을 받고 싶어진다." },
  { id: 8, dimension: "anxiety", reverse: false, text: "사랑받지 못한다는 느낌이 자주 든다." },
  { id: 9, dimension: "anxiety", reverse: false, text: "상대의 작은 반응 변화에도 마음이 흔들린다." },
  { id: 10, dimension: "anxiety", reverse: false, text: "혼자 남겨질지도 모른다는 생각이 자주 떠오른다." },
  { id: 11, dimension: "anxiety", reverse: true, text: "관계의 안정성을 의심하지 않는 편이다." },
  { id: 12, dimension: "anxiety", reverse: true, text: "상대가 답장이 늦어도 크게 흔들리지 않는다." },

  // 회피 (Avoidance) — 친밀함과 의존을 불편해하는 정도
  { id: 13, dimension: "avoidance", reverse: false, text: "누군가에게 의지하는 것이 불편하다." },
  { id: 14, dimension: "avoidance", reverse: false, text: "내 감정을 가까운 사람에게도 잘 드러내지 않는다." },
  { id: 15, dimension: "avoidance", reverse: false, text: "누군가 너무 가까이 다가오면 거리를 두고 싶어진다." },
  { id: 16, dimension: "avoidance", reverse: false, text: "혼자 있을 때가 가장 편하다." },
  { id: 17, dimension: "avoidance", reverse: false, text: "깊은 감정 이야기는 부담스럽다." },
  { id: 18, dimension: "avoidance", reverse: false, text: "도움을 요청하기보다 혼자 해결하려 한다." },
  { id: 19, dimension: "avoidance", reverse: false, text: "친밀해질수록 갑갑함이 느껴진다." },
  { id: 20, dimension: "avoidance", reverse: false, text: "약한 모습을 보이는 것이 싫다." },
  { id: 21, dimension: "avoidance", reverse: true, text: "신뢰하는 사람에게는 내 마음을 솔직하게 털어놓는다." },
  { id: 22, dimension: "avoidance", reverse: true, text: "힘들 때 가까운 사람에게 도움을 요청할 수 있다." },
  { id: 23, dimension: "avoidance", reverse: true, text: "사람과 어울리며 시간을 보내는 일이 즐겁다." },
  { id: 24, dimension: "avoidance", reverse: true, text: "내 감정을 가까운 사람에게 자연스럽게 표현한다." },
];

export default QUESTIONS;

export const LIKERT_LABELS = [
  "전혀 그렇지 않다",
  "그렇지 않다",
  "보통이다",
  "그렇다",
  "매우 그렇다",
];
