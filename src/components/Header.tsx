"use client";

import { useEffect, useState, type ComponentType, type SVGProps } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";
import {
  IconArrowUpRight,
  IconCalendar,
  IconClinic,
  IconClose,
  IconLogOut,
  IconMenu,
  IconSettings,
  IconTest,
  IconUser,
} from "@/components/icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

interface MenuItem {
  label: string;
  href: string;
  external: boolean;
  icon: Icon;
  /** 주 행동(예약)은 채워진 버튼으로 강조한다 */
  primary?: boolean;
}

const menuItems: MenuItem[] = [
  { label: "해람정신과", href: "/clinic", external: false, icon: IconClinic },
  { label: "검사", href: "/test", external: false, icon: IconTest },
  { label: "예약", href: "https://naver.me/Fy2FWU9A", external: true, icon: IconCalendar, primary: true },
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

  // 경로가 바뀌면 모바일 메뉴를 닫는다 — 렌더 중 상태 조정 패턴(effect 대신)이라 깜빡임 없이 닫힌다
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  // Esc로도 닫을 수 있게
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function linkClass(href: string, primary = false): string {
    const base =
      "pressable inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full whitespace-nowrap";
    if (primary) {
      return `${base} bg-purple-700 text-white shadow-sm shadow-purple-900/20 hover:bg-purple-800`;
    }
    const active = isActivePath(pathname, href);
    return `${base} ${
      active
        ? "bg-purple-100 text-purple-900"
        : "text-gray-600 hover:bg-gray-100 hover:text-purple-800"
    }`;
  }

  function mobileLinkClass(href: string, primary = false): string {
    const base = "pressable flex items-center gap-3 py-3 px-3 rounded-xl";
    if (primary) {
      return `${base} bg-purple-700 text-white font-semibold`;
    }
    const active = isActivePath(pathname, href);
    return `${base} ${
      active
        ? "bg-purple-50 text-purple-900 font-semibold"
        : "text-gray-700 hover:bg-gray-50 hover:text-purple-800"
    }`;
  }

  return (
    <nav
      className={`glass sticky top-0 z-50 transition-shadow duration-300 ${
        scrolled || open
          ? "shadow-[0_1px_0_0_rgba(107,63,160,0.10),0_12px_28px_-20px_rgba(17,12,46,0.35)]"
          : "shadow-none"
      }`}
      aria-label="주 메뉴"
    >
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between gap-3">
        <Link
          href="/"
          className="pressable flex items-center gap-2.5 text-lg lg:text-xl font-bold tracking-tight text-purple-950 whitespace-nowrap rounded-lg"
        >
          <Image src="/logo.png" alt="해람" width={36} height={36} className="rounded-lg" priority />
          <span className="hidden sm:inline">해람정신건강의학과</span>
        </Link>

        {/* 데스크탑 메뉴 */}
        <div className="hidden lg:flex items-center gap-1">
          {menuItems.map((item) => {
            const IconComp = item.icon;
            const content = (
              <>
                <IconComp className="w-4 h-4" />
                {item.label}
                {item.external && <IconArrowUpRight className="w-3.5 h-3.5 opacity-70 -ml-0.5" />}
              </>
            );
            return item.external ? (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`${linkClass(item.href, item.primary)} ${item.primary ? "ml-2" : ""}`}
              >
                {content}
              </a>
            ) : (
              <Link key={item.label} href={item.href} className={linkClass(item.href)}>
                {content}
              </Link>
            );
          })}

          {!loading && (claims.admin || user) && (
            <>
              <span className="w-px h-4 bg-gray-200 mx-2" aria-hidden="true" />
              {claims.admin && (
                <Link href="/admin" className={linkClass("/admin")}>
                  <IconSettings className="w-4 h-4" />
                  관리
                </Link>
              )}
              {user && (
                <>
                  <Link href="/profile" className={linkClass("/profile")}>
                    <IconUser className="w-4 h-4" />
                    프로필
                  </Link>
                  <button
                    onClick={signOut}
                    className="pressable inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-purple-800 whitespace-nowrap"
                  >
                    <IconLogOut className="w-4 h-4" />
                    로그아웃
                  </button>
                </>
              )}
            </>
          )}
        </div>

        {/* 모바일 햄버거 */}
        <button
          className="lg:hidden p-2 -mr-2 rounded-lg text-gray-700 hover:bg-gray-100 transition"
          onClick={() => setOpen(!open)}
          aria-label={open ? "메뉴 닫기" : "메뉴 열기"}
          aria-expanded={open}
          aria-controls="mobile-menu"
        >
          {open ? <IconClose className="w-6 h-6" /> : <IconMenu className="w-6 h-6" />}
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
          <div className="border-t border-purple-100/70 px-3 py-3 space-y-1">
            {menuItems.map((item) => {
              const IconComp = item.icon;
              const content = (
                <>
                  <IconComp className="w-5 h-5 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.external && <IconArrowUpRight className="w-4 h-4 opacity-70" />}
                </>
              );
              return item.external ? (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${mobileLinkClass(item.href, item.primary)} ${item.primary ? "mt-2" : ""}`}
                  onClick={() => setOpen(false)}
                >
                  {content}
                </a>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={mobileLinkClass(item.href)}
                  onClick={() => setOpen(false)}
                >
                  {content}
                </Link>
              );
            })}
            {!loading && (claims.admin || user) && (
              <>
                <div className="h-px bg-gray-100 my-2 mx-3" aria-hidden="true" />
                {claims.admin && (
                  <Link
                    href="/admin"
                    className={mobileLinkClass("/admin")}
                    onClick={() => setOpen(false)}
                  >
                    <IconSettings className="w-5 h-5 shrink-0" />
                    관리
                  </Link>
                )}
                {user && (
                  <>
                    <Link
                      href="/profile"
                      className={mobileLinkClass("/profile")}
                      onClick={() => setOpen(false)}
                    >
                      <IconUser className="w-5 h-5 shrink-0" />
                      프로필
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setOpen(false);
                      }}
                      className="pressable flex w-full items-center gap-3 text-left py-3 px-3 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-purple-800"
                    >
                      <IconLogOut className="w-5 h-5 shrink-0" />
                      로그아웃
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
