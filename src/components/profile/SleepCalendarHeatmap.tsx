"use client";

import { useEffect, useState } from "react";
import { listRecentDailyLogs, type DailyLogRecord } from "@/lib/daily-log";

interface Props {
  uid: string;
}

type Metric = "mood" | "sleepHours" | "sleepQuality" | "stress" | "energy";

const METRIC_LABEL: Record<Metric, string> = {
  mood: "기분",
  sleepHours: "수면 시간",
  sleepQuality: "수면 질",
  stress: "스트레스",
  energy: "에너지",
};

// 일자를 YYYY-MM-DD로
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push(toDateKey(d));
  }
  return out;
}

// metric 값 → 0~1 정규화
function normalize(metric: Metric, value: number | null): number | null {
  if (value === null) return null;
  if (metric === "sleepHours") {
    // 7-8시간을 최적으로 가정. 정규화는 |8-x|/8을 역수
    const optimal = 7.5;
    const dist = Math.abs(value - optimal);
    return Math.max(0, 1 - dist / 6);
  }
  // 1-5 척도
  if (metric === "stress") return 1 - (value - 1) / 4; // 낮을수록 좋음 → 진하게
  return (value - 1) / 4;
}

function colorFor(value: number | null): string {
  if (value === null) return "bg-gray-100";
  // 0~1 → 보라색 그라데이션
  if (value < 0.2) return "bg-purple-100";
  if (value < 0.4) return "bg-purple-200";
  if (value < 0.6) return "bg-purple-300";
  if (value < 0.8) return "bg-purple-500";
  return "bg-purple-700";
}

export default function SleepCalendarHeatmap({ uid }: Props) {
  const [logs, setLogs] = useState<DailyLogRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState<Metric>("sleepHours");

  useEffect(() => {
    (async () => {
      const list = await listRecentDailyLogs(uid, 60);
      setLogs(list);
      setLoading(false);
    })();
  }, [uid]);

  const days = lastNDays(42); // 6주
  const logByDate: Record<string, DailyLogRecord> = {};
  for (const l of logs) logByDate[l.date] = l;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-purple-900">최근 6주 추세</h2>
        <select
          value={metric}
          onChange={(e) => setMetric(e.target.value as Metric)}
          className="text-sm px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {(Object.keys(METRIC_LABEL) as Metric[]).map((m) => (
            <option key={m} value={m}>{METRIC_LABEL[m]}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">불러오는 중...</p>
      ) : (
        <>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d) => {
              const log = logByDate[d];
              const raw = log ? log[metric] : null;
              const norm = normalize(metric, raw);
              const cls = colorFor(norm);
              const day = parseInt(d.split("-")[2], 10);
              const isFirst = day === 1;
              return (
                <div
                  key={d}
                  title={`${d}${raw !== null ? ` · ${METRIC_LABEL[metric]} ${raw}` : " · 기록 없음"}`}
                  className={`aspect-square rounded ${cls} relative`}
                >
                  {isFirst && (
                    <span className="absolute top-0 left-0.5 text-[9px] text-gray-500">
                      {parseInt(d.split("-")[1], 10)}월
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-end gap-2 mt-3 text-xs text-gray-500">
            <span>적음</span>
            <div className="flex gap-1">
              {["bg-purple-100", "bg-purple-200", "bg-purple-300", "bg-purple-500", "bg-purple-700"].map(
                (c) => (
                  <div key={c} className={`w-3 h-3 rounded ${c}`} />
                ),
              )}
            </div>
            <span>많음</span>
          </div>
          {logs.length === 0 && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              아래에서 오늘의 기록을 입력하시면 여기에 점차 채워집니다
            </p>
          )}
        </>
      )}
    </div>
  );
}
