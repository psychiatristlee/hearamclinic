// 언어 추리 — 유추·범주 문항. 해람정신건강의학과 자체 창작 (상용 검사 문항 미사용).
// 각 문항은 독립 검증(정답 유일성)을 통과했다.

export interface ChoiceItem {
  id: number;
  question: string;
  choices: [string, string, string, string];
  answer: number; // 0~3
}

export const VERBAL_ITEMS: ChoiceItem[] = [
  { id: 1, question: "새 : 날개 = 물고기 : ?", choices: ["아가미", "비늘", "지느러미", "부레"], answer: 2 },
  { id: 2, question: "의사 : 병원 = 교사 : ?", choices: ["학교", "학생", "교과서", "칠판"], answer: 0 },
  { id: 3, question: "다음 중 성격이 다른 것은?", choices: ["사과", "배", "포도", "당근"], answer: 3 },
  { id: 4, question: "뜨겁다 : 차갑다 = 밝다 : ?", choices: ["환하다", "어둡다", "흐리다", "눈부시다"], answer: 1 },
  { id: 5, question: "밀가루 : 빵 = 포도 : ?", choices: ["포도밭", "덩굴", "포도주", "과수원"], answer: 2 },
  { id: 6, question: "다음 중 성격이 다른 것은?", choices: ["기쁨", "슬픔", "분노", "표정"], answer: 3 },
  { id: 7, question: "작곡가 : 악보 = 건축가 : ?", choices: ["설계도", "건물", "벽돌", "망치"], answer: 0 },
  { id: 8, question: "가뭄 : 비 = 어둠 : ?", choices: ["밤", "빛", "별", "구름"], answer: 1 },
  { id: 9, question: "망원경 : 멀다 = 현미경 : ?", choices: ["가깝다", "세밀하다", "어둡다", "작다"], answer: 3 },
  { id: 10, question: "다음 중 성격이 다른 것은?", choices: ["시계", "모래시계", "나침반", "달력"], answer: 2 },
  { id: 11, question: "겸손 : 오만 = 절약 : ?", choices: ["낭비", "소비", "저축", "검소"], answer: 0 },
  { id: 12, question: "다음 중 성격이 다른 것은?", choices: ["잠정적", "일시적", "임시적", "영구적"], answer: 3 },
];
