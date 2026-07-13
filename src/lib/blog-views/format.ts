// 서버·클라이언트 공용 순수 포맷 함수 ("use client" 없음)

/** 조회수 표시 포맷 — 1000 단위 콤마, 만 이상은 "1.2만" */
export function formatViewCount(n: number | undefined | null): string {
  if (!n || n < 0) return "0";
  if (n < 10000) return n.toLocaleString("ko-KR");
  const man = n / 10000;
  return `${man.toFixed(man < 10 ? 1 : 0)}만`;
}
