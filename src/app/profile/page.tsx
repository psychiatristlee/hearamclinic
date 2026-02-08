"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/AuthContext";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [authorName, setAuthorName] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(true);

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
    <div className="max-w-md">
      <h1 className="text-2xl font-bold mb-6">프로필</h1>

      <div className="mb-6">
        <p className="text-sm text-gray-500 mb-1">이메일</p>
        <p className="text-gray-900">{user.email}</p>
      </div>

      <div className="mb-6">
        <p className="text-sm font-medium text-gray-700 mb-2">저자 이름</p>
        {editing ? (
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="블로그에 표시될 이름"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
        ) : (
          <p className="text-gray-900">{authorName || "설정되지 않음"}</p>
        )}
      </div>

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
  );
}
