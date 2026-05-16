"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

interface Props {
  children: React.ReactNode;
  message?: string;
}

export default function RequireAuth({ children, message }: Props) {
  const { user, loading } = useAuth();
  const pathname = usePathname() ?? "/";

  if (loading) {
    return (
      <p className="text-center py-12 text-gray-500">불러오는 중...</p>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto">
        <div className="bg-white border border-purple-200 rounded-2xl p-8 text-center shadow-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-purple-900 mb-2">
            로그인이 필요해요
          </h2>
          <p className="text-sm text-gray-600 mb-6 leading-relaxed">
            {message ??
              "본인의 결과를 계정에 안전하게 기록하고 추세를 확인하기 위해 로그인이 필요합니다."}
            <br />
            블로그는 로그인 없이 자유롭게 보실 수 있어요.
          </p>
          <Link
            href={`/login?redirect=${encodeURIComponent(pathname)}`}
            className="inline-block w-full px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
          >
            로그인하기
          </Link>
          <p className="text-xs text-gray-400 mt-4">
            처음 방문이신가요? 같은 화면에서 가입하실 수 있어요.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
