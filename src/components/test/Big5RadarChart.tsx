"use client";

import React from "react";

interface Big5RadarChartProps {
  // 0~1 사이 값
  scores: { O: number; C: number; E: number; A: number; N: number };
  size?: number;
}

const AXES: Array<{ key: "O" | "C" | "E" | "A" | "N"; label: string }> = [
  { key: "O", label: "개방성" },
  { key: "C", label: "성실성" },
  { key: "E", label: "외향성" },
  { key: "A", label: "친화성" },
  { key: "N", label: "정서 민감성" },
];

export default function Big5RadarChart({
  scores,
  size = 320,
}: Big5RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.36;
  const labelRadius = radius + 28;

  // 5개 꼭짓점 좌표 계산 (위에서 시작, 시계방향)
  const angles = AXES.map((_, i) => -Math.PI / 2 + (2 * Math.PI * i) / AXES.length);

  function pointAt(angle: number, r: number) {
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
  }

  // 동심 펜타곤 (배경 격자)
  const gridLevels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // 사용자 점수 다각형
  const scorePoints = AXES.map((axis, i) => {
    const value = Math.max(0, Math.min(1, scores[axis.key]));
    return pointAt(angles[i], radius * value);
  });

  return (
    <svg
      viewBox={`0 0 ${size} ${size + 30}`}
      width="100%"
      style={{ maxWidth: size + 30, height: "auto" }}
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
      {scorePoints.map((p, i) => (
        <circle
          key={i}
          cx={p[0]}
          cy={p[1]}
          r={4}
          fill="rgb(147 51 234)"
        />
      ))}

      {/* 축 라벨 */}
      {AXES.map((axis, i) => {
        const [x, y] = pointAt(angles[i], labelRadius);
        const value = Math.round(scores[axis.key] * 100);
        return (
          <g key={axis.key}>
            <text
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={13}
              fontWeight={600}
              fill="rgb(88 28 135)"
            >
              {axis.label}
            </text>
            <text
              x={x}
              y={y + 14}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fill="rgb(107 114 128)"
            >
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
