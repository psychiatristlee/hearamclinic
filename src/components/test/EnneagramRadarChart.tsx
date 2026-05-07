"use client";

import React from "react";
import { EnneaType } from "@/lib/test/enneagram/questions";
import { TYPES } from "@/lib/test/enneagram/types";

interface Props {
  // 각 유형별 0~1 점수
  scores: Record<EnneaType, number>;
  dominantType?: EnneaType;
  size?: number;
}

const TYPE_NUMBERS: EnneaType[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function EnneagramRadarChart({
  scores,
  dominantType,
  size = 360,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.34;
  const labelRadius = radius + 26;

  const angles = TYPE_NUMBERS.map(
    (_, i) => -Math.PI / 2 + (2 * Math.PI * i) / TYPE_NUMBERS.length,
  );

  function pointAt(angle: number, r: number) {
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
  }

  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  const scorePoints = TYPE_NUMBERS.map((num, i) => {
    const value = Math.max(0, Math.min(1, scores[num] ?? 0));
    return pointAt(angles[i], radius * value);
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      style={{ maxWidth: size, height: "auto" }}
    >
      {/* 배경 격자 */}
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={angles
            .map((a) => pointAt(a, radius * level).join(","))
            .join(" ")}
          fill="none"
          stroke="rgb(229 231 235)"
          strokeWidth={1}
        />
      ))}

      {/* 축 선 */}
      {angles.map((a, i) => {
        const [x2, y2] = pointAt(a, radius);
        return (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={x2}
            y2={y2}
            stroke="rgb(229 231 235)"
            strokeWidth={1}
          />
        );
      })}

      {/* 사용자 점수 영역 */}
      <polygon
        points={scorePoints.map((p) => p.join(",")).join(" ")}
        fill="rgb(168 85 247 / 0.25)"
        stroke="rgb(147 51 234)"
        strokeWidth={2}
      />

      {/* 점수 점 */}
      {scorePoints.map((p, i) => {
        const num = TYPE_NUMBERS[i];
        const isDominant = dominantType === num;
        return (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r={isDominant ? 6 : 4}
            fill={isDominant ? "rgb(126 34 206)" : "rgb(147 51 234)"}
            stroke={isDominant ? "white" : "none"}
            strokeWidth={isDominant ? 2 : 0}
          />
        );
      })}

      {/* 축 라벨 */}
      {TYPE_NUMBERS.map((num, i) => {
        const [x, y] = pointAt(angles[i], labelRadius);
        const value = Math.round((scores[num] ?? 0) * 100);
        const isDominant = dominantType === num;
        return (
          <g key={num}>
            <text
              x={x}
              y={y - 4}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12}
              fontWeight={700}
              fill={isDominant ? "rgb(126 34 206)" : "rgb(88 28 135)"}
            >
              {num}. {TYPES[num].name}
            </text>
            <text
              x={x}
              y={y + 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fill={isDominant ? "rgb(126 34 206)" : "rgb(107 114 128)"}
              fontWeight={isDominant ? 700 : 400}
            >
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
