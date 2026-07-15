// 수리 추리 — 수열의 규칙을 찾는 문항. 해람정신건강의학과 자체 창작.
// 각 문항은 독립 검증(규칙·정답 유일성)을 통과했다.

import type { ChoiceItem } from "./verbal";

export const NUMBER_ITEMS: ChoiceItem[] = [
  { id: 1, question: "3, 6, 9, 12, ?", choices: ["14", "15", "16", "18"], answer: 1 },
  { id: 2, question: "2, 4, 8, 16, ?", choices: ["24", "30", "32", "34"], answer: 2 },
  { id: 3, question: "45, 40, 35, 30, ?", choices: ["25", "20", "24", "26"], answer: 0 },
  { id: 4, question: "81, 27, 9, 3, ?", choices: ["0", "2", "6", "1"], answer: 3 },
  { id: 5, question: "2, 3, 5, 8, 12, ?", choices: ["16", "17", "18", "20"], answer: 1 },
  { id: 6, question: "1, 10, 3, 20, 5, 30, ?", choices: ["7", "40", "9", "6"], answer: 0 },
  { id: 7, question: "3, 6, 7, 14, 15, 30, ?", choices: ["29", "60", "31", "32"], answer: 2 },
  { id: 8, question: "4, 100, 9, 90, 16, 80, ?", choices: ["70", "20", "36", "25"], answer: 3 },
  { id: 9, question: "2, 5, 7, 12, 19, 31, ?", choices: ["43", "50", "48", "62"], answer: 1 },
  { id: 10, question: "2, 6, 12, 20, 30, ?", choices: ["40", "36", "42", "44"], answer: 2 },
  { id: 11, question: "3, 5, 9, 17, 33, ?", choices: ["65", "63", "64", "66"], answer: 0 },
  { id: 12, question: "4, 6, 9, 14, 21, 32, ?", choices: ["43", "44", "47", "45"], answer: 3 },
];
