"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

interface MenuItem {
  label: string;
  href: string;
  external: boolean;
  group: "main" | "test" | "booking";
}

const menuItems: MenuItem[] = [
  { label: "🏥 해람정신과", href: "/clinic", external: false, group: "main" },
  { label: "🔬 검사", href: "/test", external: false, group: "test" },
  { label: "📅 예약", href: "https://naver.me/Fy2FWU9A", external: true, group: "booking" },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  // 검사 메뉴는 /test, /attention, /personality 모두 활성화
  if (href === "/test") {
    return (
      pathname.startsWith("/test") ||
      pathname.startsWith("/attention") ||
      pathname.startsWith("/personality")
    );
  }
  return pathname === href || pathname.startsWith(href + "/");
}

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, claims, loading, signOut } = useAuth();
  const pathname = usePathname() ?? "";

  // 스크롤 엣지 효과: 콘텐츠가 헤더 아래로 들어갈 때만 옅은 그림자를 띄운다 (항상 보이는 1px 선 대신)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 경로가 바뀌면 모바일 메뉴를 닫고, Esc로도 닫을 수 있게
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function linkClass(href: string, base = ""): string {
    const active = isActivePath(pathname, href);
    return `${base} pressable text-sm font-medium px-3 py-1.5 rounded-full whitespace-nowrap ${
      active
        ? "bg-purple-100 text-purple-800"
        : "text-gray-600 hover:bg-gray-100 hover:text-purple-700"
    }`;
  }

  function mobileLinkClass(href: string): string {
    const active = isActivePath(pathname, href);
    return `pressable block py-3 px-3 rounded-lg ${
      active
        ? "bg-purple-50 text-purple-800 font-semibold"
        : "text-gray-700 hover:bg-gray-50 hover:text-purple-700"
    }`;
  }

  return (
    <nav
      className={`glass sticky top-0 z-50 transition-shadow duration-300 ${
        scrolled || open
          ? "shadow-[0_1px_0_0_rgba(107,63,160,0.10),0_12px_28px_-20px_rgba(17,12,46,0.35)]"
          : "shadow-none"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="pressable flex items-center gap-2 text-lg lg:text-xl font-bold tracking-tight text-purple-900 whitespace-nowrap rounded-lg"
        >
          <Image src="/logo.png" alt="해람" width={36} height={36} className="rounded-lg" />
          <span className="hidden sm:inline">해람정신건강의학과</span>
        </Link>

        {/* 데스크탑 메뉴 */}
        <div className="hidden lg:flex items-center gap-1">
          {menuItems.map((item, idx) => {
            const prev = menuItems[idx - 1];
            const showDivider = prev && prev.group !== item.group;
            return (
              <div key={item.label} className="flex items-center gap-1">
                {showDivider && (
                  <span className="w-px h-4 bg-gray-200 mx-1" aria-hidden="true" />
                )}
                {item.external ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass(item.href, "")}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link href={item.href} className={linkClass(item.href, "")}>
                    {item.label}
                  </Link>
                )}
              </div>
            );
          })}

          {!loading && (
            <>
              {claims.admin && (
                <>
                  <span className="w-px h-4 bg-gray-200 mx-1" aria-hidden="true" />
                  <Link href="/admin" className={linkClass("/admin", "")}>
                    ⚙️ 관리
                  </Link>
                </>
              )}
              {user && (
                <>
                  <span className="w-px h-4 bg-gray-200 mx-1" aria-hidden="true" />
                  <Link href="/profile" className={linkClass("/profile", "")}>
                    👤 프로필
                  </Link>
                  <button
                    onClick={signOut}
                    className="text-sm font-medium px-3 py-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-purple-700 transition whitespace-nowrap"
                  >
                    👋 로그아웃
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* 모바일 햄버거 */}
        <button
          className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          onClick={() => setOpen(!open)}
          aria-label="메뉴"
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* 모바일 메뉴 드롭다운 — 항상 마운트해 두고 높이(grid-rows)·투명도로 열고 닫는다.
          열릴 때와 닫힐 때 같은 경로를 지나므로 중간에 다시 눌러도 자연스럽게 되돌아간다. */}
      <div
        id="mobile-menu"
        inert={!open}
        className={`lg:hidden grid transition-[grid-template-rows,opacity] duration-200 ease-out-soft motion-reduce:transition-[opacity] ${
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-purple-100/70 px-3 py-2 space-y-1">
            {menuItems.map((item, idx) => {
              const prev = menuItems[idx - 1];
              const showDivider = prev && prev.group !== item.group;
              return (
                <div key={item.label}>
                  {showDivider && (
                    <div className="h-px bg-gray-100 my-1.5 mx-3" aria-hidden="true" />
                  )}
                  {item.external ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={mobileLinkClass(item.href)}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className={mobileLinkClass(item.href)}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              );
            })}
            {!loading && (
              <>
                <div className="h-px bg-gray-100 my-1.5 mx-3" aria-hidden="true" />
                {claims.admin && (
                  <Link
                    href="/admin"
                    className={mobileLinkClass("/admin")}
                    onClick={() => setOpen(false)}
                  >
                    ⚙️ 관리
                  </Link>
                )}
                {user && (
                  <>
                    <Link
                      href="/profile"
                      className={mobileLinkClass("/profile")}
                      onClick={() => setOpen(false)}
                    >
                      👤 프로필
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setOpen(false);
                      }}
                      className="block w-full text-left py-3 px-3 rounded-lg text-gray-500 hover:bg-gray-50 hover:text-purple-700 transition"
                    >
                      👋 로그아웃
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
