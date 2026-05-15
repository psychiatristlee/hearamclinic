"use client";

import { useEffect, useState } from "react";
import {
  DailyLog,
  getDailyLog,
  saveDailyLog,
  todayKst,
} from "@/lib/daily-log";

interface Props {
  uid: string;
}

const MOOD_LABELS = ["😞 매우 나쁨", "😕 나쁨", "😐 보통", "🙂 좋음", "😄 매우 좋음"];
const STRESS_LABELS = ["없음", "낮음", "보통", "높음", "매우 높음"];
const SLEEP_QUALITY_LABELS = ["매우 나쁨", "나쁨", "보통", "좋음", "매우 좋음"];

export default function DailyTrackingWidget({ uid }: Props) {
  const [today] = useState(todayKst());
  const [log, setLog] = useState<DailyLog>({
    date: today,
    mood: null,
    sleepHours: null,
    sleepQuality: null,
    stress: null,
    energy: null,
    note: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    (async () => {
      const existing = await getDailyLog(uid, today);
      if (existing) {
        setLog({
          date: today,
          mood: existing.mood,
          sleepHours: existing.sleepHours,
          sleepQuality: existing.sleepQuality,
          stress: existing.stress,
          energy: existing.energy,
          note: existing.note ?? "",
        });
        setSavedAt(existing.updatedAt);
      }
      setLoading(false);
    })();
  }, [uid, today]);

  async function autoSave(next: DailyLog) {
    setSaving(true);
    const ok = await saveDailyLog(next);
    setSaving(false);
    if (ok) setSavedAt(new Date());
  }

  function update<K extends keyof DailyLog>(key: K, value: DailyLog[K]) {
    const next = { ...log, [key]: value };
    setLog(next);
    autoSave(next);
  }

  if (loading) return <p className="text-sm text-gray-500">불러오는 중...</p>;

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-bold text-purple-900">오늘의 기록</h2>
        <p className="text-xs text-gray-500">
          {savedAt ? `저장됨 · ${savedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}` : "아직 기록 전"}
          {saving && " (저장 중...)"}
        </p>
      </div>

      {/* 기분 */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">오늘 기분은 어떠세요?</p>
        <div className="grid grid-cols-5 gap-2">
          {MOOD_LABELS.map((label, i) => {
            const value = i + 1;
            const selected = log.mood === value;
            return (
              <button
                key={value}
                onClick={() => update("mood", value)}
                className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg border transition text-xs ${
                  selected ? "bg-purple-600 border-purple-600 text-white" : "bg-white border-gray-300 text-gray-700 hover:border-purple-400"
                }`}
              >
                <span className="text-lg">{label.split(" ")[0]}</span>
                <span className="text-[10px] leading-tight">{label.split(" ")[1]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 수면 */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">간밤에 잠은 어떠셨나요?</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">수면 시간 (시간)</p>
            <input
              type="number"
              min={0}
              max={14}
              step={0.5}
              value={log.sleepHours ?? ""}
              onChange={(e) => {
                const v = e.target.value === "" ? null : parseFloat(e.target.value);
                update("sleepHours", v);
              }}
              placeholder="예: 7"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">수면 질</p>
            <select
              value={log.sleepQuality ?? ""}
              onChange={(e) => {
                const v = e.target.value === "" ? null : parseInt(e.target.value, 10);
                update("sleepQuality", v);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">선택</option>
              {SLEEP_QUALITY_LABELS.map((label, i) => (
                <option key={i} value={i + 1}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 스트레스 */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">오늘 스트레스 수준</p>
        <div className="grid grid-cols-5 gap-2">
          {STRESS_LABELS.map((label, i) => {
            const value = i + 1;
            const selected = log.stress === value;
            return (
              <button
                key={value}
                onClick={() => update("stress", value)}
                className={`py-2 rounded-lg border transition text-xs ${
                  selected ? "bg-purple-600 border-purple-600 text-white" : "bg-white border-gray-300 text-gray-700 hover:border-purple-400"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 에너지 */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">에너지 수준</p>
        <div className="grid grid-cols-5 gap-2">
          {[1, 2, 3, 4, 5].map((value) => {
            const selected = log.energy === value;
            return (
              <button
                key={value}
                onClick={() => update("energy", value)}
                className={`py-2 rounded-lg border transition text-xs font-semibold ${
                  selected ? "bg-purple-600 border-purple-600 text-white" : "bg-white border-gray-300 text-gray-700 hover:border-purple-400"
                }`}
              >
                {value}
              </button>
            );
          })}
        </div>
      </div>

      {/* 메모 */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-sm font-medium text-gray-700 mb-2">한 줄 메모 (선택)</p>
        <textarea
          value={log.note ?? ""}
          onChange={(e) => setLog({ ...log, note: e.target.value })}
          onBlur={() => autoSave(log)}
          rows={2}
          placeholder="오늘 있었던 일이나 떠오르는 생각"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
        />
      </div>
    </div>
  );
}
