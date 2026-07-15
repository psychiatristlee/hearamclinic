"use client";

import type { MatrixCellSpec, MatrixShape, MatrixFill, MatrixSize } from "@/lib/test/iq/matrix";

const SIZE_R: Record<MatrixSize, number> = { s: 11, m: 17, l: 24 };
const COLOR = "rgb(88 28 135)"; // purple-900

// count개 도형의 중심 좌표 (viewBox 100×100)
function centers(count: number): Array<[number, number]> {
  switch (count) {
    case 2: return [[33, 50], [67, 50]];
    case 3: return [[50, 30], [30, 68], [70, 68]];
    case 4: return [[32, 32], [68, 32], [32, 68], [68, 68]];
    default: return [[50, 50]];
  }
}

function shapePath(shape: MatrixShape, cx: number, cy: number, r: number): React.ReactElement {
  switch (shape) {
    case "circle":
      return <circle cx={cx} cy={cy} r={r} />;
    case "square":
      return <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} />;
    case "triangle":
      return <polygon points={`${cx},${cy - r} ${cx - r * 0.95},${cy + r * 0.75} ${cx + r * 0.95},${cy + r * 0.75}`} />;
    case "diamond":
      return <polygon points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`} />;
    case "cross": {
      const w = r * 0.42;
      return (
        <path d={`M${cx - w},${cy - r} h${w * 2} v${r - w} h${r - w} v${w * 2} h-${r - w} v${r - w} h-${w * 2} v-${r - w} h-${r - w} v-${w * 2} h${r - w} z`} />
      );
    }
  }
}

function fillProps(fill: MatrixFill) {
  if (fill === "empty") return { fill: "none", stroke: COLOR, strokeWidth: 3 };
  return { fill: COLOR, stroke: COLOR, strokeWidth: 2 };
}

/** 행렬 한 칸을 SVG로 렌더 */
export default function MatrixCell({ spec, className }: { spec: MatrixCellSpec; className?: string }) {
  const { shape, count = 1, fill = "solid", rot = 0, size = "m" } = spec;
  const r = count > 1 ? Math.min(SIZE_R[size], 13) : SIZE_R[size];
  const halfId = `half-${shape}-${count}-${rot}-${size}`;

  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden>
      {fill === "half" && (
        <defs>
          <clipPath id={halfId}><rect x="0" y="0" width="50" height="100" /></clipPath>
        </defs>
      )}
      {centers(count).map(([cx, cy], i) => (
        <g key={i} transform={rot ? `rotate(${rot} ${cx} ${cy})` : undefined}>
          {fill === "half" ? (
            <>
              <g fill={COLOR} clipPath={`url(#${halfId})`}>{shapePath(shape, cx, cy, r)}</g>
              <g fill="none" stroke={COLOR} strokeWidth={3}>{shapePath(shape, cx, cy, r)}</g>
            </>
          ) : (
            <g {...fillProps(fill)}>{shapePath(shape, cx, cy, r)}</g>
          )}
        </g>
      ))}
    </svg>
  );
}
