"use client";

import React from "react";
import { AttachmentTypeCode } from "@/lib/test/attachment/types";

interface Props {
  // 0~1 사이 값 (x: 회피, y: 불안)
  avoidance: number;
  anxiety: number;
  dominantType: AttachmentTypeCode;
  size?: number;
}

const TYPE_LABEL: Record<AttachmentTypeCode, { ko: string }> = {
  secure: { ko: "안정형" },
  anxious: { ko: "헌신형" },
  avoidant: { ko: "자립형" },
  disorganized: { ko: "양가형" },
};

export default function AttachmentScatterChart({
  avoidance,
  anxiety,
  dominantType,
  size = 320,
}: Props) {
  const padding = 36;
  const inner = size - padding * 2;

  // 사용자 좌표: 좌하단(낮은 회피, 낮은 불안)이 안정형
  // x축: 회피 (왼쪽=낮음, 오른쪽=높음)
  // y축: 불안 (아래=낮음, 위=높음)
  const x = padding + avoidance * inner;
  const y = padding + (1 - anxiety) * inner;

  // 사분면 좌표 (라벨 위치)
  const quadrants: Array<{
    x: number;
    y: number;
    code: AttachmentTypeCode;
    label: string;
  }> = [
    {
      x: padding + inner * 0.25,
      y: padding + inner * 0.75,
      code: "secure",
      label: "안정형",
    },
    {
      x: padding + inner * 0.25,
      y: padding + inner * 0.25,
      code: "anxious",
      label: "헌신형",
    },
    {
      x: padding + inner * 0.75,
      y: padding + inner * 0.75,
      code: "avoidant",
      label: "자립형",
    },
    {
      x: padding + inner * 0.75,
      y: padding + inner * 0.25,
      code: "disorganized",
      label: "양가형",
    },
  ];

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width="100%"
      style={{ maxWidth: size, height: "auto" }}
    >
      {/* 사분면 배경 (안정형은 강조) */}
      <rect
        x={padding}
        y={padding + inner / 2}
        width={inner / 2}
        height={inner / 2}
        fill="rgb(220 252 231 / 0.5)"
      />
      <rect
        x={padding}
        y={padding}
        width={inner / 2}
        height={inner / 2}
        fill="rgb(254 226 226 / 0.3)"
      />
      <rect
        x={padding + inner / 2}
        y={padding + inner / 2}
        width={inner / 2}
        height={inner / 2}
        fill="rgb(219 234 254 / 0.3)"
      />
      <rect
        x={padding + inner / 2}
        y={padding}
        width={inner / 2}
        height={inner / 2}
        fill="rgb(243 232 255 / 0.3)"
      />

      {/* 축 (가운데 십자) */}
      <line
        x1={padding}
        y1={padding + inner / 2}
        x2={size - padding}
        y2={padding + inner / 2}
        stroke="rgb(156 163 175)"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      <line
        x1={padding + inner / 2}
        y1={padding}
        x2={padding + inner / 2}
        y2={size - padding}
        stroke="rgb(156 163 175)"
        strokeWidth={1}
        strokeDasharray="3 3"
      />

      {/* 외곽 박스 */}
      <rect
        x={padding}
        y={padding}
        width={inner}
        height={inner}
        fill="none"
        stroke="rgb(229 231 235)"
        strokeWidth={1}
      />

      {/* 사분면 라벨 */}
      {quadrants.map((q) => {
        const isDominant = q.code === dominantType;
        return (
          <text
            key={q.code}
            x={q.x}
            y={q.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={14}
            fontWeight={isDominant ? 700 : 500}
            fill={isDominant ? "rgb(126 34 206)" : "rgb(107 114 128)"}
            opacity={isDominant ? 1 : 0.6}
          >
            {q.label}
          </text>
        );
      })}

      {/* 축 이름 */}
      <text
        x={size / 2}
        y={size - 8}
        textAnchor="middle"
        fontSize={11}
        fill="rgb(75 85 99)"
        fontWeight={600}
      >
        회피 →
      </text>
      <text
        x={12}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={11}
        fill="rgb(75 85 99)"
        fontWeight={600}
        transform={`rotate(-90, 12, ${size / 2})`}
      >
        ← 불안
      </text>

      {/* 사용자 위치 점 */}
      <circle
        cx={x}
        cy={y}
        r={10}
        fill="rgb(168 85 247 / 0.3)"
      />
      <circle
        cx={x}
        cy={y}
        r={6}
        fill="rgb(147 51 234)"
        stroke="white"
        strokeWidth={2}
      />

      {/* 점수 표기 */}
      <text
        x={x}
        y={y - 16}
        textAnchor="middle"
        fontSize={10}
        fill="rgb(88 28 135)"
        fontWeight={700}
      >
        {TYPE_LABEL[dominantType].ko}
      </text>
    </svg>
  );
}
