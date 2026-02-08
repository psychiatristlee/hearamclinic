"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/AuthContext";

const menuItems = [
  { label: "🏥 해람정신과", href: "https://clinic.hearam.kr", external: true },
  { label: "🔬 해람검사실", href: "https://test.hearam.kr", external: true },
  { label: "📅 예약하기", href: "https://naver.me/Fy2FWU9A", external: true },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const { user, claims, loading, signInWithGoogle, signOut } = useAuth();

  return (
    <nav className="border-b border-purple-100 bg-white sticky top-0 z-50">
      <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-purple-900">
          <Image src="/logo.png" alt="해람" width={36} height={36} className="rounded-lg" />
          해람정신건강의학과
        </Link>

        {/* 데스크탑 메뉴 */}
        <div className="hidden md:flex items-center gap-6">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-purple-700 transition"
            >
              {item.label}
            </a>
          ))}
          {!loading && (
            <>
              {claims.admin && (
                <Link
                  href="/admin"
                  className="text-gray-600 hover:text-purple-700 transition"
                >
                  ⚙️ 관리
                </Link>
              )}
              {user ? (
                <div className="flex items-center gap-3">
                  <Link
                    href="/profile"
                    className="text-sm text-gray-600 hover:text-purple-700 transition"
                  >
                    👤 프로필
                  </Link>
                  <button
                    onClick={signOut}
                    className="text-sm text-gray-500 hover:text-purple-600 transition"
                  >
                    👋 로그아웃
                  </button>
                </div>
              ) : (
                <button
                  onClick={signInWithGoogle}
                  className="text-sm text-gray-600 hover:text-purple-700 transition"
                >
                  🔑 로그인
                </button>
              )}
            </>
          )}
        </div>

        {/* 모바일 햄버거 */}
        <button
          className="md:hidden p-2"
          onClick={() => setOpen(!open)}
          aria-label="메뉴"
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

      {/* 모바일 메뉴 드롭다운 */}
      {open && (
        <div className="md:hidden border-t border-purple-100 bg-white">
          <div className="px-4 py-2 space-y-1">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block py-3 text-gray-600 hover:text-purple-700 transition"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            {!loading && (
              <>
                {claims.admin && (
                  <Link
                    href="/admin"
                    className="block py-3 text-gray-600 hover:text-purple-700 transition"
                    onClick={() => setOpen(false)}
                  >
                    ⚙️ 관리
                  </Link>
                )}
                {user ? (
                  <>
                    <Link
                      href="/profile"
                      className="block py-3 text-gray-600 hover:text-purple-700 transition"
                      onClick={() => setOpen(false)}
                    >
                      👤 프로필
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setOpen(false);
                      }}
                      className="block py-3 text-sm text-gray-500 hover:text-purple-600 transition"
                    >
                      👋 로그아웃
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      signInWithGoogle();
                      setOpen(false);
                    }}
                    className="block py-3 text-sm text-gray-600 hover:text-purple-700 transition"
                  >
                    🔑 로그인
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
