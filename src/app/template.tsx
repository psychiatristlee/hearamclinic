/**
 * 라우트가 바뀔 때마다 다시 마운트되는 래퍼.
 * 새 화면이 살짝 떠오르며 나타나도록(.page-enter, @starting-style) 한다 —
 * 콘텐츠가 뚝 바뀌는 대신 재질이 도착하는 느낌. 감소된 모션에서는 페이드만.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
