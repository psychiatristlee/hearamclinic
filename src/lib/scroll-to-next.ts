"use client";

/**
 * 리커트/선다형 문항에서 답을 선택하면 다음 문항(id="q-{다음번호}")으로
 * 부드럽게 스크롤한다. 다음 문항이 현재 페이지에 없으면 아무 일도 하지 않는다.
 */
export function scrollToNextQuestion(currentId: number): void {
  requestAnimationFrame(() => {
    document
      .getElementById(`q-${currentId + 1}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  });
}
