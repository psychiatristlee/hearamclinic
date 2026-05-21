"use client";

import { DiscDimension } from "@/lib/test/disc/questions";

interface Props {
  scores: Record<DiscDimension, number>; // 0~1
  dominantCode: DiscDimension;
  size?: number;
}

const AXES: Array<{ key: DiscDimension; label: string; ko: string }> = [
  { key: "D", label: "D", ko: "주도" },
  { key: "I", label: "I", ko: "사교" },
  { key: "S", label: "S", ko: "안정" },
  { key: "C", label: "C", ko: "신중" },
];

export default function DiscRadarChart({
  scores,
  dominantCode,
  size = 320,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.34;
  const labelRadius = radius + 30;

  // 4축: 위(D), 오른쪽(I), 아래(S), 왼쪽(C) — 다이아몬드 형태
  const angles = AXES.map((_, i) => -Math.PI / 2 + (2 * Math.PI * i) / AXES.length);

  function pointAt(angle: number, r: number) {
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
  }

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const scorePoints = AXES.map((axis, i) => {
    const v = Math.max(0, Math.min(1, scores[axis.key] ?? 0));
    return pointAt(angles[i], radius * v);
  });

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size }}>
      {gridLevels.map((level) => (
        <polygon
          key={level}
          points={angles.map((a) => pointAt(a, radius * level).join(",")).join(" ")}
          fill="none"
          stroke="rgb(229 231 235)"
          strokeWidth={1}
        />
      ))}

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

      <polygon
        points={scorePoints.map((p) => p.join(",")).join(" ")}
        fill="rgb(168 85 247 / 0.25)"
        stroke="rgb(147 51 234)"
        strokeWidth={2}
      />

      {scorePoints.map((p, i) => {
        const isDominant = AXES[i].key === dominantCode;
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

      {AXES.map((axis, i) => {
        const [x, y] = pointAt(angles[i], labelRadius);
        const value = Math.round((scores[axis.key] ?? 0) * 100);
        const isDom = axis.key === dominantCode;
        return (
          <g key={axis.key}>
            <text
              x={x}
              y={y - 6}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={14}
              fontWeight={700}
              fill={isDom ? "rgb(126 34 206)" : "rgb(88 28 135)"}
            >
              {axis.label}. {axis.ko}
            </text>
            <text
              x={x}
              y={y + 10}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={11}
              fill={isDom ? "rgb(126 34 206)" : "rgb(107 114 128)"}
              fontWeight={isDom ? 700 : 400}
            >
              {value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
