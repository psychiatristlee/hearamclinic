"use client";

import { useEffect, useState } from "react";
import { listUserTestResults, type TestResultRecord } from "@/lib/test-history";

interface Props {
  uid: string;
}

const CATEGORY_LABEL: Record<string, string> = {
  personality: "🌱 성격",
  questionnaire: "📋 심리",
  attention: "🧠 집중력",
  tracking: "📅 트래킹",
};

export default function TestHistoryWidget({ uid }: Props) {
  const [records, setRecords] = useState<TestResultRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const list = await listUserTestResults(uid, { max: 50 });
      setRecords(list);
      setLoading(false);
    })();
  }, [uid]);

  if (loading) return <p className="text-sm text-gray-500">불러오는 중...</p>;

  if (records.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
        <p className="text-gray-500 mb-2">아직 검사 기록이 없습니다</p>
        <p className="text-sm text-gray-400">
          심리검사·집중력 검사·성격 검사를 진행하시면 여기에 기록이 모입니다
        </p>
      </div>
    );
  }

  // 같은 type 묶기 → 최신 + 진행 횟수 표시
  const byType: Record<string, TestResultRecord[]> = {};
  for (const r of records) {
    if (!byType[r.type]) byType[r.type] = [];
    byType[r.type].push(r);
  }
  const groups = Object.values(byType).sort(
    (a, b) => b[0].completedAt.getTime() - a[0].completedAt.getTime(),
  );

  return (
    <div className="space-y-3">
      {groups.map((items) => {
        const latest = items[0];
        return (
          <div
            key={latest.type}
            className="bg-white border border-gray-200 rounded-2xl p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500">
                    {CATEGORY_LABEL[latest.category] ?? latest.category}
                  </span>
                  {items.length > 1 && (
                    <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">
                      {items.length}회 진행
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-gray-900">{latest.displayTitle}</h3>
                <p className="text-sm text-purple-700 mt-1 truncate">{latest.summary}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {latest.completedAt.toLocaleString("ko-KR", {
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {items.length > 1 && (
              <details className="mt-3 pt-3 border-t border-gray-100">
                <summary className="text-xs text-purple-600 cursor-pointer hover:underline">
                  이전 결과 보기
                </summary>
                <ul className="mt-2 space-y-1">
                  {items.slice(1).map((r) => (
                    <li key={r.id} className="text-xs text-gray-600 flex justify-between">
                      <span className="truncate">{r.summary}</span>
                      <span className="text-gray-400 flex-shrink-0 ml-2">
                        {r.completedAt.toLocaleDateString("ko-KR")}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}
