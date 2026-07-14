"use client";

import { SchemaDomain, DOMAIN_ORDER } from "@/lib/test/schema/questions";
import { DOMAINS, intensityOf } from "@/lib/test/schema/types";

interface Props {
  // 0~100 도식영역 점수
  domainScores: Record<SchemaDomain, number>;
  dominant: SchemaDomain;
}

/**
 * 기존 성격검사(단일 유형 + 레이더)와 달리, 심리도식 검사는 다섯 영역의
 * '강도'를 수평 막대로 보여 준다. 누구나 모든 영역을 정도만 다르게 지닌다는
 * 도식치료의 관점을 반영한 시각화.
 */
export default function SchemaProfileChart({ domainScores, dominant }: Props) {
  return (
    <div className="space-y-4">
      {DOMAIN_ORDER.map((code) => {
        const info = DOMAINS[code];
        const score = Math.round(domainScores[code] ?? 0);
        const isDom = code === dominant;
        return (
          <div key={code}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: info.color }}
                />
                <span
                  className={`text-sm truncate ${isDom ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}
                >
                  {info.name}
                </span>
                {isDom && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold flex-shrink-0">
                    대표
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-xs text-gray-400">{intensityOf(score)}</span>
                <span
                  className="text-sm font-bold tabular-nums"
                  style={{ color: info.color }}
                >
                  {score}
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${Math.max(3, score)}%`,
                  backgroundColor: info.color,
                  opacity: isDom ? 1 : 0.72,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
