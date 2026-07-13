"use client";

import { RiasecCode } from "@/lib/test/riasec/questions";
import { TYPES } from "@/lib/test/riasec/types";

interface Props {
  scores: Record<RiasecCode, number>; // 0~1
  dominantCode: RiasecCode;
  size?: number;
}

// 육각형 인접 순서 (R-I-A-S-E-C). 위(R)에서 시계방향.
const AXES: RiasecCode[] = ["R", "I", "A", "S", "E", "C"];
const AXIS_COLOR: Record<RiasecCode, string> = {
  R: "rgb(132 138 60)",
  I: "rgb(59 130 246)",
  A: "rgb(168 85 247)",
  S: "rgb(244 114 92)",
  E: "rgb(234 88 12)",
  C: "rgb(20 160 160)",
};

export default function RiasecRadarChart({
  scores,
  dominantCode,
  size = 340,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.32;
  const labelRadius = radius + 34;

  const angles = AXES.map((_, i) => -Math.PI / 2 + (2 * Math.PI * i) / AXES.length);

  function pointAt(angle: number, r: number) {
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
  }

  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const scorePoints = AXES.map((code, i) => {
    const v = Math.max(0, Math.min(1, scores[code] ?? 0));
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
          <line key={i} x1={cx} y1={cy} x2={x2} y2={y2} stroke="rgb(229 231 235)" strokeWidth={1} />
        );
      })}

      <polygon
        points={scorePoints.map((p) => p.join(",")).join(" ")}
        fill="rgb(168 85 247 / 0.22)"
        stroke="rgb(147 51 234)"
        strokeWidth={2}
      />

      {scorePoints.map((p, i) => {
        const code = AXES[i];
        const isDom = code === dominantCode;
        return (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r={isDom ? 6 : 4}
            fill={isDom ? "rgb(126 34 206)" : AXIS_COLOR[code]}
            stroke={isDom ? "white" : "none"}
            strokeWidth={isDom ? 2 : 0}
          />
        );
      })}

      {AXES.map((code, i) => {
        const [x, y] = pointAt(angles[i], labelRadius);
        const value = Math.round((scores[code] ?? 0) * 100);
        const isDom = code === dominantCode;
        return (
          <g key={code}>
            <text
              x={x}
              y={y - 6}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={13}
              fontWeight={700}
              fill={isDom ? "rgb(126 34 206)" : "rgb(55 65 81)"}
            >
              {code} {TYPES[code].name}
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
