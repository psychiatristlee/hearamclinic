"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import {
  listUserTestResults,
  type TestResultRecord,
} from "@/lib/test-history";
import {
  fetchTestStats,
  computeComparison,
  getMetric,
  type ComparisonResult,
} from "@/lib/test-stats";
import TestTrendChart from "./TestTrendChart";
import PercentileDisplay from "./PercentileDisplay";

interface MetricDef {
  metricKey: string;
  label: string;
  color: string;
  /** 결과 객체에서 값을 추출 */
  extract: (result: Record<string, unknown>) => number | undefined;
  unit?: string;
  yMin?: number;
  yMax?: number;
  lowerIsBetter?: boolean;
}

interface Props {
  testType: string;
  /** 현재 검사 결과 (방금 마친 것) */
  currentResult: Record<string, unknown>;
  metrics: MetricDef[];
  title?: string;
}

interface PointSeries {
  metric: MetricDef;
  points: { date: Date; value: number }[];
}

export default function ResultInsights({
  testType,
  currentResult,
  metrics,
  title = "내 기록과 다른 사람들과의 비교",
}: Props) {
  const [user, setUser] = useState(() => auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<TestResultRecord[]>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof fetchTestStats>>>(
    null,
  );

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const [hist, st] = await Promise.all([
          listUserTestResults(user.uid, { type: testType, max: 30 }),
          fetchTestStats(testType),
        ]);
        setHistory(hist);
        setStats(st);
      } catch (err) {
        console.error("[ResultInsights]", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, testType]);

  // 비로그인이면 아예 숨김
  if (!user) return null;

  // 추세용 시리즈 구성
  const seriesData: PointSeries[] = metrics.map((m) => {
    const points = history
      .map((h) => {
        const v = m.extract(h.result);
        return v === undefined ? null : { date: h.completedAt, value: v };
      })
      .filter((p): p is { date: Date; value: number } => p !== null);
    return { metric: m, points };
  });

  // 비교 계산
  const comparisons: Array<{ metric: MetricDef; userValue: number; comp: ComparisonResult | null }> = metrics.map(
    (m) => {
      const userValue = m.extract(currentResult);
      if (userValue === undefined) {
        return { metric: m, userValue: 0, comp: null };
      }
      const ms = getMetric(stats, m.metricKey);
      const comp = computeComparison(ms, userValue, {
        lowerIsBetter: m.lowerIsBetter,
      });
      return { metric: m, userValue, comp };
    },
  );

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <p className="text-sm text-gray-500 text-center">기록을 불러오는 중...</p>
      </div>
    );
  }

  const hasTrend = seriesData.some((s) => s.points.length >= 2);

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-6">
      <h2 className="text-lg font-bold text-purple-900 mb-4">{title}</h2>

      {/* 비교 카드 */}
      <div className="space-y-3 mb-5">
        {comparisons.map((c) => (
          <PercentileDisplay
            key={c.metric.metricKey}
            label={c.metric.label}
            userValue={c.userValue}
            comparison={c.comp}
            unit={c.metric.unit}
            lowerIsBetter={c.metric.lowerIsBetter}
          />
        ))}
      </div>

      {/* 추세 그래프 */}
      <div className="border-t border-gray-100 pt-4">
        <h3 className="text-sm font-semibold text-purple-900 mb-3">
          내 과거 점수 추세
        </h3>
        {hasTrend ? (
          <TestTrendChart
            series={seriesData
              .filter((s) => s.points.length >= 1)
              .map((s) => ({
                name: s.metric.label,
                color: s.metric.color,
                points: s.points,
              }))}
            yMin={metrics[0].yMin}
            yMax={metrics[0].yMax}
            yLabel={metrics.length === 1 ? metrics[0].unit : undefined}
          />
        ) : (
          <p className="text-xs text-gray-500 text-center py-6">
            이 검사를 다시 진행하시면 추세가 표시됩니다.
          </p>
        )}
      </div>
    </div>
  );
}
