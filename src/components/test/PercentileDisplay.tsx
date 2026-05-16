"use client";

import type { ComparisonResult } from "@/lib/test-stats";

interface Props {
  label: string;
  userValue: number;
  comparison: ComparisonResult | null;
  /** 점수 표시 단위 (예: "점", "%", "ms") */
  unit?: string;
  /** 점수가 낮을수록 좋은지 (false=높을수록 상위) */
  lowerIsBetter?: boolean;
}

export default function PercentileDisplay({
  label,
  userValue,
  comparison,
  unit = "",
  lowerIsBetter = false,
}: Props) {
  if (!comparison) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-500">
        {label}: 비교 데이터를 불러오지 못했습니다.
      </div>
    );
  }

  if (!comparison.enoughData) {
    return (
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-500">
        <span className="font-medium text-gray-700">{label}</span>: 표본이 충분하지 않아 비교가 어렵습니다 ({comparison.count}명)
      </div>
    );
  }

  const p = comparison.percentile;
  // 백분위 해석 라벨
  let band = "평균";
  let bandColor = "text-purple-700 bg-purple-50 border-purple-100";
  if (p >= 90) {
    band = "최상위";
    bandColor = "text-pink-700 bg-pink-50 border-pink-100";
  } else if (p >= 70) {
    band = "상위";
    bandColor = "text-emerald-700 bg-emerald-50 border-emerald-100";
  } else if (p >= 30) {
    band = "평균";
    bandColor = "text-purple-700 bg-purple-50 border-purple-100";
  } else if (p >= 10) {
    band = "하위";
    bandColor = "text-amber-700 bg-amber-50 border-amber-100";
  } else {
    band = "최하위";
    bandColor = "text-rose-700 bg-rose-50 border-rose-100";
  }

  // 한국어 문장 구성
  const direction = lowerIsBetter ?
    (p >= 50 ? "낮은 편" : "높은 편") :
    (p >= 50 ? "높은 편" : "낮은 편");

  return (
    <div className={`border rounded-lg p-4 ${bandColor}`}>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-sm font-semibold">{label}</span>
        <span className="text-xs opacity-70">표본 {comparison.count}명</span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-xs opacity-70 mb-0.5">내 점수</p>
          <p className="text-xl font-bold">
            {userValue}
            <span className="text-xs font-normal ml-0.5">{unit}</span>
          </p>
        </div>
        <div>
          <p className="text-xs opacity-70 mb-0.5">T 점수</p>
          <p className="text-xl font-bold">{comparison.tScore}</p>
        </div>
        <div>
          <p className="text-xs opacity-70 mb-0.5">백분위</p>
          <p className="text-xl font-bold">{p}%</p>
        </div>
      </div>

      {/* 백분위 막대 */}
      <div className="relative w-full h-2.5 bg-white/60 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-current opacity-60 rounded-full transition-all"
          style={{ width: `${p}%` }}
        />
        <div
          className="absolute top-0 w-0.5 h-full bg-current opacity-90"
          style={{ left: "50%" }}
          aria-label="평균"
        />
      </div>

      <p className="text-xs leading-relaxed">
        평균(T=50)보다 {direction}이며, 응답하신 분들 중 상위 {p}% 영역에 위치합니다.
        <span className="opacity-70 ml-1">
          (전체 평균 {comparison.mean}{unit}, 표준편차 {comparison.stddev})
        </span>
      </p>
    </div>
  );
}
