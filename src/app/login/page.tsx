"use client";

import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@/lib/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const { user, loading, signInWithGoogle } = useAuth();
  const [error, setError] = useState("");
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
    <div className="flex justify-center items-center min-h-[50vh] px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">관리자 로그인</h1>
        <p className="text-gray-500 mb-6 leading-relaxed">
          해람정신건강의학과 관리자 계정으로 로그인해 주세요.
        </p>

        <button
          onClick={async () => {
            setError("");
            try {
              await signInWithGoogle();
            } catch {
              setError("허용된 관리자 Google 계정만 로그인할 수 있습니다.");
            }
          }}
          className="w-full px-6 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white transition font-semibold shadow-md"
        >
          Google로 로그인
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <p className="text-xs text-gray-400 mt-3">
          신규 회원가입은 받지 않습니다.
        </p>
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
