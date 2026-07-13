"use client";

import { useEffect, useState, useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

interface FeedbackItem {
  id: string;
  message: string;
  category: string;
  email: string;
  path: string;
  uid: string;
  status: string;
  createdAt: number | null;
}

interface ListResult {
  items: FeedbackItem[];
  newCount: number;
}

const CATEGORY_LABELS: Record<string, string> = {
  improvement: "기능 개선",
  bug: "오류 신고",
  content: "콘텐츠",
  other: "기타",
};

const STATUS_TABS: Array<{ key: string; label: string }> = [
  { key: "new", label: "미확인" },
  { key: "resolved", label: "해결" },
  { key: "archived", label: "보관" },
  { key: "all", label: "전체" },
];

export default function FeedbackAdminSection() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [newCount, setNewCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<string>("new");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const fn = httpsCallable<unknown, ListResult>(functions, "listFeedback");
      const res = await fn({ max: 300 });
      setItems(res.data.items);
      setNewCount(res.data.newCount);
    } catch (err) {
      console.error(err);
      setError("피드백을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(id: string, status: string) {
    setUpdatingId(id);
    try {
      const fn = httpsCallable(functions, "updateFeedbackStatus");
      await fn({ id, status });
      // 로컬 반영
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, status } : it)),
      );
      setNewCount((prev) =>
        status === "new" ? prev + 1 : Math.max(0, prev - 0),
      );
      // 정확한 카운트를 위해 재로드는 생략, new 카운트만 근사 갱신
      setNewCount(
        items
          .map((it) => (it.id === id ? { ...it, status } : it))
          .filter((it) => it.status === "new").length,
      );
    } catch (err) {
      console.error(err);
      alert("상태 변경에 실패했습니다.");
    } finally {
      setUpdatingId(null);
    }
  }

  const filtered =
    tab === "all" ? items : items.filter((it) => it.status === tab);

  function formatDate(ms: number | null): string {
    if (!ms) return "";
    return new Date(ms).toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return (
    <section>
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-2xl font-bold">개선 제안 (피드백)</h2>
        {newCount > 0 && (
          <span className="px-2.5 py-0.5 bg-red-100 text-red-700 text-sm font-semibold rounded-full">
            미확인 {newCount}
          </span>
        )}
      </div>

      {/* 상태 탭 */}
      <div className="flex gap-2 mb-5">
        {STATUS_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
              tab === t.key
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={load}
          className="ml-auto px-3 py-1.5 text-sm text-purple-600 hover:underline"
        >
          새로고침
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm">불러오는 중...</p>
      ) : error ? (
        <p className="text-red-500 text-sm">{error}</p>
      ) : filtered.length === 0 ? (
        <p className="text-gray-400 text-sm">
          {tab === "new" ? "미확인 피드백이 없습니다." : "해당 항목이 없습니다."}
        </p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((it) => (
            <li
              key={it.id}
              className={`border rounded-xl p-4 ${
                it.status === "new"
                  ? "border-purple-200 bg-purple-50/40"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                  {CATEGORY_LABELS[it.category] ?? it.category}
                </span>
                <span className="text-xs text-gray-400">{formatDate(it.createdAt)}</span>
                {it.path && (
                  <span className="text-xs text-gray-400">· {it.path}</span>
                )}
                {it.status !== "new" && (
                  <span className="text-xs text-gray-400">
                    · {it.status === "resolved" ? "해결됨" : "보관됨"}
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed mb-2">
                {it.message}
              </p>

              <div className="flex items-center gap-3 flex-wrap">
                {it.email && (
                  <a
                    href={`mailto:${it.email}`}
                    className="text-xs text-purple-600 hover:underline"
                  >
                    ✉ {it.email}
                  </a>
                )}
                {it.uid && (
                  <span className="text-xs text-gray-400">uid: {it.uid.slice(0, 8)}…</span>
                )}
                <div className="ml-auto flex gap-2">
                  {it.status !== "resolved" && (
                    <button
                      onClick={() => changeStatus(it.id, "resolved")}
                      disabled={updatingId === it.id}
                      className="text-xs px-2.5 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 transition"
                    >
                      해결
                    </button>
                  )}
                  {it.status !== "archived" && (
                    <button
                      onClick={() => changeStatus(it.id, "archived")}
                      disabled={updatingId === it.id}
                      className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition"
                    >
                      보관
                    </button>
                  )}
                  {it.status !== "new" && (
                    <button
                      onClick={() => changeStatus(it.id, "new")}
                      disabled={updatingId === it.id}
                      className="text-xs px-2.5 py-1 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 disabled:opacity-50 transition"
                    >
                      미확인으로
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
