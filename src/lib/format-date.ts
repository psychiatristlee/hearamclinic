/** Firestore Timestamp의 seconds → 화면용 날짜 문자열과 <time dateTime> 값 */
export function formatPostDate(seconds: number): { label: string; iso: string } {
  const d = new Date(seconds * 1000);
  if (!seconds || Number.isNaN(d.getTime())) return { label: "", iso: "" };
  const label = new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  }).format(d);
  return { label, iso: d.toISOString().slice(0, 10) };
}
