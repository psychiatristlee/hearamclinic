"use client";

import { Suspense, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && user) {
      router.replace(searchParams.get("redirect") || "/");
    }
  }, [user, loading, router, searchParams]);

  if (loading) return <p className="text-gray-500">로딩 중...</p>;
  if (user) return null;

  return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="text-center space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
        <p className="text-gray-500">관리 기능을 사용하려면 로그인해주세요.</p>
        <button
          onClick={signInWithGoogle}
          className="px-6 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700 shadow-sm"
        >
          Google로 로그인
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-gray-500">로딩 중...</p>}>
      <LoginContent />
    </Suspense>
  );
}
