"use client";

interface TrendPoint {
  date: Date;
  value: number;
  label?: string;
}

interface Series {
  name: string;
  color: string;
  points: TrendPoint[];
}

interface Props {
  series: Series[];
  height?: number;
  yMin?: number;
  yMax?: number;
  yLabel?: string;
}

export default function TestTrendChart({
  series,
  height = 200,
  yMin,
  yMax,
  yLabel,
}: Props) {
  // 모든 포인트의 날짜/값 모으기
  const allPoints = series.flatMap((s) => s.points);
  if (allPoints.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-6">
        이전 결과가 없습니다. 검사를 다시 진행하시면 추세가 표시됩니다.
      </p>
    );
  }

  const dates = allPoints.map((p) => p.date.getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const dateRange = Math.max(maxDate - minDate, 1);

  const values = allPoints.map((p) => p.value);
  const actualMin = yMin ?? Math.min(...values, 0);
  const actualMax = yMax ?? Math.max(...values);
  const valueRange = Math.max(actualMax - actualMin, 1);

  const W = 600;
  const H = height;
  const PAD = { left: 36, right: 16, top: 12, bottom: 28 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  function xPos(d: Date): number {
    if (dateRange === 0) return PAD.left + innerW / 2;
    return PAD.left + ((d.getTime() - minDate) / dateRange) * innerW;
  }
  function yPos(v: number): number {
    return PAD.top + (1 - (v - actualMin) / valueRange) * innerH;
  }

  // y 축 눈금 (5개)
  const ticks = 4;
  const yTicks: number[] = [];
  for (let i = 0; i <= ticks; i++) {
    yTicks.push(actualMin + (valueRange * i) / ticks);
  }

  function formatDate(d: Date): string {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ maxWidth: W, height: "auto" }}
      >
        {/* y축 격자 */}
        {yTicks.map((t, i) => {
          const y = yPos(t);
          return (
            <g key={i}>
              <line
                x1={PAD.left}
                y1={y}
                x2={W - PAD.right}
                y2={y}
                stroke="rgb(229 231 235)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 6}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={10}
                fill="rgb(107 114 128)"
              >
                {Math.round(t)}
              </text>
            </g>
          );
        })}

        {/* x축 라벨 (시작/끝 날짜) */}
        <text x={PAD.left} y={H - 8} fontSize={10} fill="rgb(107 114 128)">
          {formatDate(new Date(minDate))}
        </text>
        <text
          x={W - PAD.right}
          y={H - 8}
          fontSize={10}
          fill="rgb(107 114 128)"
          textAnchor="end"
        >
          {formatDate(new Date(maxDate))}
        </text>

        {/* y라벨 */}
        {yLabel && (
          <text
            x={4}
            y={PAD.top - 2}
            fontSize={10}
            fill="rgb(75 85 99)"
            fontWeight={600}
          >
            {yLabel}
          </text>
        )}

        {/* 시리즈별 라인 + 점 */}
        {series.map((s, si) => {
          const sortedPoints = [...s.points].sort(
            (a, b) => a.date.getTime() - b.date.getTime(),
          );
          if (sortedPoints.length === 0) return null;

          const pathD = sortedPoints
            .map((p, i) => {
              const x = xPos(p.date);
              const y = yPos(p.value);
              return `${i === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ");

          return (
            <g key={si}>
              <path
                d={pathD}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {sortedPoints.map((p, i) => (
                <circle
                  key={i}
                  cx={xPos(p.date)}
                  cy={yPos(p.value)}
                  r={3.5}
                  fill={s.color}
                  stroke="white"
                  strokeWidth={1.5}
                />
              ))}
            </g>
          );
        })}
      </svg>

      {/* 범례 */}
      {series.length > 1 && (
        <div className="flex flex-wrap gap-3 justify-center mt-2 text-xs text-gray-600">
          {series.map((s, i) => (
            <div key={i} className="flex items-center gap-1">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
