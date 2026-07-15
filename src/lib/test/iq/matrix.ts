// 도형 행렬 추리 — 3×3 행렬의 규칙을 찾아 빈 칸을 채우는 유동추론 과제.
// 모든 문항은 해람정신건강의학과가 규칙 기반으로 자체 제작 (상용 검사 문항 미사용).

export type MatrixShape = "circle" | "square" | "triangle" | "diamond" | "cross";
export type MatrixFill = "solid" | "empty" | "half";
export type MatrixSize = "s" | "m" | "l";

export interface MatrixCellSpec {
  shape: MatrixShape;
  count?: number; // 1~4 (기본 1)
  fill?: MatrixFill; // 기본 solid
  rot?: number; // 회전(도), 기본 0
  size?: MatrixSize; // 기본 m
}

export interface MatrixItem {
  id: number;
  grid: (MatrixCellSpec | null)[]; // 9칸, 마지막(8번)은 null(빈칸)
  options: MatrixCellSpec[]; // 4지선다
  answer: number; // 0~3
  rule: string; // 유지보수용 규칙 설명 (화면 미노출)
}

const C = (
  shape: MatrixShape,
  extra: Partial<MatrixCellSpec> = {},
): MatrixCellSpec => ({ shape, ...extra });

export const MATRIX_ITEMS: MatrixItem[] = [
  {
    id: 1,
    rule: "행마다 도형 고정, 열 따라 개수 1→2→3",
    grid: [
      C("circle", { count: 1 }), C("circle", { count: 2 }), C("circle", { count: 3 }),
      C("square", { count: 1 }), C("square", { count: 2 }), C("square", { count: 3 }),
      C("triangle", { count: 1 }), C("triangle", { count: 2 }), null,
    ],
    options: [
      C("triangle", { count: 3 }),
      C("triangle", { count: 2 }),
      C("square", { count: 3 }),
      C("circle", { count: 3 }),
    ],
    answer: 0,
  },
  {
    id: 2,
    rule: "열 따라 90도씩 회전 (0→90→180)",
    grid: [
      C("triangle", { rot: 0 }), C("triangle", { rot: 90 }), C("triangle", { rot: 180 }),
      C("cross", { rot: 0 }), C("cross", { rot: 45 }), C("cross", { rot: 90 }),
      C("triangle", { rot: 0 }), C("triangle", { rot: 90 }), null,
    ],
    options: [
      C("triangle", { rot: 270 }),
      C("triangle", { rot: 180 }),
      C("triangle", { rot: 0 }),
      C("triangle", { rot: 90 }),
    ],
    answer: 1,
  },
  {
    id: 3,
    rule: "열 따라 채움 solid→half→empty, 행마다 도형 다름",
    grid: [
      C("circle", { fill: "solid" }), C("circle", { fill: "half" }), C("circle", { fill: "empty" }),
      C("square", { fill: "solid" }), C("square", { fill: "half" }), C("square", { fill: "empty" }),
      C("diamond", { fill: "solid" }), C("diamond", { fill: "half" }), null,
    ],
    options: [
      C("diamond", { fill: "solid" }),
      C("circle", { fill: "empty" }),
      C("diamond", { fill: "empty" }),
      C("diamond", { fill: "half" }),
    ],
    answer: 2,
  },
  {
    id: 4,
    rule: "열 따라 크기 s→m→l",
    grid: [
      C("circle", { size: "s" }), C("circle", { size: "m" }), C("circle", { size: "l" }),
      C("square", { size: "s" }), C("square", { size: "m" }), C("square", { size: "l" }),
      C("triangle", { size: "s" }), C("triangle", { size: "m" }), null,
    ],
    options: [
      C("triangle", { size: "s" }),
      C("square", { size: "l" }),
      C("triangle", { size: "m" }),
      C("triangle", { size: "l" }),
    ],
    answer: 3,
  },
  {
    id: 5,
    rule: "라틴 방진 — 각 행·열에 원/사각형/삼각형이 한 번씩",
    grid: [
      C("circle"), C("square"), C("triangle"),
      C("square"), C("triangle"), C("circle"),
      C("triangle"), C("circle"), null,
    ],
    options: [
      C("square"),
      C("triangle"),
      C("circle"),
      C("diamond"),
    ],
    answer: 0,
  },
  {
    id: 6,
    rule: "왼쪽 개수 + 가운데 개수 = 오른쪽 개수",
    grid: [
      C("circle", { count: 1, size: "s" }), C("circle", { count: 1, size: "s" }), C("circle", { count: 2, size: "s" }),
      C("circle", { count: 2, size: "s" }), C("circle", { count: 1, size: "s" }), C("circle", { count: 3, size: "s" }),
      C("circle", { count: 1, size: "s" }), C("circle", { count: 2, size: "s" }), null,
    ],
    options: [
      C("circle", { count: 2, size: "s" }),
      C("circle", { count: 4, size: "s" }),
      C("circle", { count: 3, size: "s" }),
      C("circle", { count: 1, size: "s" }),
    ],
    answer: 2,
  },
  {
    id: 7,
    rule: "도형 라틴 방진 + 행 따라 채움 solid→half→empty",
    grid: [
      C("circle", { fill: "solid" }), C("square", { fill: "solid" }), C("triangle", { fill: "solid" }),
      C("triangle", { fill: "half" }), C("circle", { fill: "half" }), C("square", { fill: "half" }),
      C("square", { fill: "empty" }), C("triangle", { fill: "empty" }), null,
    ],
    options: [
      C("circle", { fill: "solid" }),
      C("circle", { fill: "empty" }),
      C("square", { fill: "empty" }),
      C("triangle", { fill: "empty" }),
    ],
    answer: 1,
  },
  {
    id: 8,
    rule: "행 따라 개수 1→2→3, 열 따라 채움 solid→half→empty",
    grid: [
      C("cross", { count: 1, fill: "solid" }), C("cross", { count: 1, fill: "half" }), C("cross", { count: 1, fill: "empty" }),
      C("cross", { count: 2, fill: "solid" }), C("cross", { count: 2, fill: "half" }), C("cross", { count: 2, fill: "empty" }),
      C("cross", { count: 3, fill: "solid" }), C("cross", { count: 3, fill: "half" }), null,
    ],
    options: [
      C("cross", { count: 2, fill: "empty" }),
      C("cross", { count: 3, fill: "solid" }),
      C("cross", { count: 3, fill: "half" }),
      C("cross", { count: 3, fill: "empty" }),
    ],
    answer: 3,
  },
  {
    id: 9,
    rule: "열마다 도형 고정, 크기 라틴 방진",
    grid: [
      C("circle", { size: "s" }), C("square", { size: "m" }), C("triangle", { size: "l" }),
      C("circle", { size: "m" }), C("square", { size: "l" }), C("triangle", { size: "s" }),
      C("circle", { size: "l" }), C("square", { size: "s" }), null,
    ],
    options: [
      C("triangle", { size: "l" }),
      C("triangle", { size: "m" }),
      C("square", { size: "m" }),
      C("triangle", { size: "s" }),
    ],
    answer: 1,
  },
  {
    id: 10,
    rule: "열 따라 개수 1→2→3, 행 따라 회전 0→90→180",
    grid: [
      C("triangle", { count: 1, rot: 0, size: "s" }), C("triangle", { count: 2, rot: 0, size: "s" }), C("triangle", { count: 3, rot: 0, size: "s" }),
      C("triangle", { count: 1, rot: 90, size: "s" }), C("triangle", { count: 2, rot: 90, size: "s" }), C("triangle", { count: 3, rot: 90, size: "s" }),
      C("triangle", { count: 1, rot: 180, size: "s" }), C("triangle", { count: 2, rot: 180, size: "s" }), null,
    ],
    options: [
      C("triangle", { count: 3, rot: 90, size: "s" }),
      C("triangle", { count: 2, rot: 180, size: "s" }),
      C("triangle", { count: 3, rot: 180, size: "s" }),
      C("triangle", { count: 3, rot: 0, size: "s" }),
    ],
    answer: 2,
  },
];
