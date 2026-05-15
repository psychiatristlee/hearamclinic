"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";
import DailyTrackingWidget from "@/components/profile/DailyTrackingWidget";
import SleepCalendarHeatmap from "@/components/profile/SleepCalendarHeatmap";
import TestHistoryWidget from "@/components/profile/TestHistoryWidget";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authorName, setAuthorName] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [tab, setTab] = useState<"today" | "history" | "settings">("today");

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login?redirect=/profile");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    async function fetchProfile() {
      const snap = await getDoc(doc(db, "users", user!.uid));
      if (snap.exists()) {
        setAuthorName(snap.data().authorName || "");
      } else {
        setAuthorName(user!.displayName || "");
      }
      setFetching(false);
    }
    fetchProfile();
  }, [user]);

  async function handleSave() {
    if (!user || !authorName.trim()) return;
    setSaving(true);
    await setDoc(doc(db, "users", user.uid), { authorName: authorName.trim() }, { merge: true });
    setSaving(false);
    setEditing(false);
  }

  if (loading || fetching) return <p className="text-gray-500">로딩 중...</p>;
  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-purple-900 mb-1">내 마음 대시보드</h1>
        <p className="text-gray-600 text-sm">
          오늘의 컨디션 기록부터 검사 결과까지 한 곳에서 살펴보세요
        </p>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {[
          { id: "today", label: "오늘" },
          { id: "history", label: "검사 기록" },
          { id: "settings", label: "설정" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
              tab === t.id
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-gray-500 hover:text-purple-600"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "today" && (
        <div className="space-y-5">
          <SleepCalendarHeatmap uid={user.uid} />
          <DailyTrackingWidget uid={user.uid} />
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-3">
          <TestHistoryWidget uid={user.uid} />
          <div className="mt-6 flex flex-wrap gap-2">
            <Link
              href="/test"
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:border-purple-400 hover:text-purple-700 transition"
            >
              심리검사 둘러보기
            </Link>
            <Link
              href="/attention"
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:border-purple-400 hover:text-purple-700 transition"
            >
              집중력 검사 둘러보기
            </Link>
            <Link
              href="/personality"
              className="px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:border-purple-400 hover:text-purple-700 transition"
            >
              성격 검사 둘러보기
            </Link>
          </div>
        </div>
      )}

      {tab === "settings" && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm text-gray-500 mb-1">이메일</p>
            <p className="text-gray-900">{user.email}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-sm font-medium text-gray-700 mb-2">저자 이름</p>
            <p className="text-xs text-gray-500 mb-3">블로그에 표시될 이름입니다 (작성 권한이 있는 경우)</p>
            {editing ? (
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="블로그에 표시될 이름"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 mb-3"
                autoFocus
              />
            ) : (
              <p className="text-gray-900 mb-3">{authorName || "설정되지 않음"}</p>
            )}

            {editing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !authorName.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition"
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditing(true)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                이름 편집하기
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
