"use client";

import { doc, getDoc, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface MetricStats {
  count: number;
  sum: number;
  sumSq: number;
}

interface TestStats {
  type: string;
  metrics: Record<string, MetricStats>;
}

export interface ComparisonResult {
  mean: number;
  stddev: number;
  z: number;
  tScore: number;
  percentile: number; // 0-100
  count: number; // 표본 크기
  enoughData: boolean; // 표본이 충분한지
  /** 점수가 낮을수록 좋은 metric 여부 (예: 반응 시간, 우울 점수) */
  lowerIsBetter?: boolean;
}

export async function fetchTestStats(testType: string): Promise<TestStats | null> {
  try {
    const snap = await getDoc(doc(db, "testStats", testType));
    if (!snap.exists()) return null;
    return snap.data() as TestStats;
  } catch (err) {
    console.error("[fetchTestStats]", err);
    return null;
  }
}

/**
 * 표준정규분포의 CDF 근사값 (Abramowitz & Stegun).
 */
function normalCdf(z: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp((-z * z) / 2);
  const p =
    d *
    t *
    (0.3193815 +
      t *
        (-0.3565638 +
          t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return z >= 0 ? 1 - p : p;
}

const MIN_SAMPLE = 5;

export function computeComparison(
  stats: MetricStats | undefined,
  userValue: number,
  options?: { lowerIsBetter?: boolean },
): ComparisonResult | null {
  if (!stats) return null;
  const enough = stats.count >= MIN_SAMPLE;
  const count = stats.count;
  if (count === 0) return null;
  const mean = stats.sum / count;
  const rawVar = stats.sumSq / count - mean * mean;
  const variance = Math.max(rawVar, 1); // floor
  const stddev = Math.sqrt(variance);
  const z = (userValue - mean) / stddev;
  // T점수: 평균=50, 표준편차=10
  const tScore = Math.round(50 + 10 * z);
  // 백분위: lowerIsBetter면 점수 낮을수록 상위
  const cdf = normalCdf(z);
  const percentile = options?.lowerIsBetter
    ? Math.round((1 - cdf) * 100)
    : Math.round(cdf * 100);

  return {
    mean: Math.round(mean * 10) / 10,
    stddev: Math.round(stddev * 10) / 10,
    z,
    tScore,
    percentile,
    count,
    enoughData: enough,
    lowerIsBetter: options?.lowerIsBetter,
  };
}

export function getMetric(
  stats: TestStats | null,
  metricKey: string,
): MetricStats | undefined {
  if (!stats) return undefined;
  return stats.metrics?.[metricKey];
}
