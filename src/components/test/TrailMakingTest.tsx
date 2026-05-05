"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";

const TOTAL_NODES = 15; // 1~15
const BOARD_WIDTH = 360;
const BOARD_HEIGHT = 480;
const NODE_SIZE = 44; // 지름
const MARGIN = 20;
const MIN_DISTANCE = 70; // 노드간 최소 거리

type Status = "ready" | "test" | "result";

interface Node {
  num: number;
  x: number;
  y: number;
}

function placeNodes(): Node[] {
  const nodes: Node[] = [];
  let attempts = 0;
  while (nodes.length < TOTAL_NODES && attempts < 5000) {
    attempts++;
    const x = MARGIN + Math.random() * (BOARD_WIDTH - 2 * MARGIN - NODE_SIZE);
    const y = MARGIN + Math.random() * (BOARD_HEIGHT - 2 * MARGIN - NODE_SIZE);
    let ok = true;
    for (const n of nodes) {
      const dx = n.x - x;
      const dy = n.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < MIN_DISTANCE) {
        ok = false;
        break;
      }
    }
    if (ok) {
      nodes.push({ num: nodes.length + 1, x, y });
    }
  }
  // 부족하면 그리드 폴백
  if (nodes.length < TOTAL_NODES) {
    const cols = 4;
    const rows = Math.ceil(TOTAL_NODES / cols);
    const cellW = (BOARD_WIDTH - 2 * MARGIN) / cols;
    const cellH = (BOARD_HEIGHT - 2 * MARGIN) / rows;
    const grid: Node[] = [];
    for (let i = 0; i < TOTAL_NODES; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      grid.push({
        num: i + 1,
        x: MARGIN + c * cellW + Math.random() * (cellW - NODE_SIZE),
        y: MARGIN + r * cellH + Math.random() * (cellH - NODE_SIZE),
      });
    }
    return grid;
  }
  return nodes;
}

export default function TrailMakingTest() {
  const [status, setStatus] = useState<Status>("ready");
  const [nodes, setNodes] = useState<Node[]>([]);
  const [next, setNext] = useState(1); // 다음 눌러야 할 번호
  const [errors, setErrors] = useState(0);
  const [startMs, setStartMs] = useState<number>(0);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [shake, setShake] = useState(false);

  const startTest = useCallback(() => {
    setNodes(placeNodes());
    setNext(1);
    setErrors(0);
    setStartMs(Date.now());
    setElapsedMs(0);
    setStatus("test");
  }, []);

  // 진행 시간 표시
  useEffect(() => {
    if (status !== "test") return;
    const id = setInterval(() => {
      setElapsedMs(Date.now() - startMs);
    }, 100);
    return () => clearInterval(id);
  }, [status, startMs]);

  const handleNodeClick = (num: number) => {
    if (status !== "test") return;
    if (num === next) {
      if (num === TOTAL_NODES) {
        setElapsedMs(Date.now() - startMs);
        setStatus("result");
      } else {
        setNext(num + 1);
      }
    } else {
      setErrors((e) => e + 1);
      setShake(true);
      setTimeout(() => setShake(false), 250);
    }
  };

  const reset = () => {
    setStatus("ready");
    setNodes([]);
    setNext(1);
    setErrors(0);
    setStartMs(0);
    setElapsedMs(0);
  };

  // 지나간 노드들의 경로 표시
  const path = useMemo(() => {
    return nodes
      .filter((n) => n.num < next)
      .sort((a, b) => a.num - b.num)
      .map((n) => ({
        x: n.x + NODE_SIZE / 2,
        y: n.y + NODE_SIZE / 2,
      }));
  }, [nodes, next]);

  return (
    <div className="mx-auto max-w-2xl">
      {status === "ready" && (
        <div>
          <h1 className="text-3xl font-bold text-purple-900 mb-6">
            궤적 잇기 검사 (Trail Making Test)
          </h1>
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">테스트 방법</h3>
            <p className="mb-3 font-medium text-gray-800">
              시각적 주의력과 처리 속도를 측정하는 검사입니다.
            </p>
            <p className="text-sm mb-3 text-purple-700">
              화면에 흩어진 숫자 1부터 {TOTAL_NODES}까지 순서대로 클릭하세요. 잘못된 숫자를 누르면 오류가 누적됩니다.
            </p>
            <p className="text-sm mb-4 font-medium text-purple-700">
              총 소요 시간과 오류 횟수가 기록됩니다.
            </p>
            <div className="flex justify-center">
              <button
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
                onClick={startTest}
              >
                테스트 시작
              </button>
            </div>
          </div>
        </div>
      )}

      {status === "test" && (
        <div>
          <div className="flex justify-between items-center mb-4 mt-4">
            <p className="text-purple-900 text-lg font-bold">
              다음: <span className="text-2xl">{next}</span>
            </p>
            <p className="text-sm text-gray-600">
              시간 {(elapsedMs / 1000).toFixed(1)}s · 오류 {errors}
            </p>
          </div>
          <div
            className={`relative mx-auto bg-white border-2 border-purple-200 rounded-xl overflow-hidden ${
              shake ? "animate-pulse" : ""
            }`}
            style={{ width: BOARD_WIDTH, height: BOARD_HEIGHT }}
          >
            {/* 경로 라인 */}
            {path.length >= 2 && (
              <svg
                className="absolute inset-0 pointer-events-none"
                width={BOARD_WIDTH}
                height={BOARD_HEIGHT}
              >
                <polyline
                  fill="none"
                  stroke="rgb(168 85 247)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={path.map((p) => `${p.x},${p.y}`).join(" ")}
                />
              </svg>
            )}
            {/* 노드들 */}
            {nodes.map((n) => {
              const passed = n.num < next;
              const isNext = n.num === next;
              return (
                <button
                  key={n.num}
                  onClick={() => handleNodeClick(n.num)}
                  style={{
                    position: "absolute",
                    left: n.x,
                    top: n.y,
                    width: NODE_SIZE,
                    height: NODE_SIZE,
                  }}
                  className={`rounded-full font-bold text-base flex items-center justify-center transition border-2 ${
                    passed ?
                      "bg-purple-100 border-purple-300 text-purple-400" :
                      isNext ?
                        "bg-purple-600 border-purple-700 text-white shadow-lg" :
                        "bg-white border-gray-300 text-gray-800 hover:border-purple-400"
                  }`}
                >
                  {n.num}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {status === "result" && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-purple-900 mb-6">검사 결과</h2>
          <div className="space-y-4 divide-y divide-gray-100">
            <div className="pb-4">
              <p className="text-gray-600 mb-1">총 소요 시간</p>
              <p className="text-3xl font-bold text-purple-600">
                {(elapsedMs / 1000).toFixed(1)}초
              </p>
            </div>
            <div className="pt-4">
              <p className="text-gray-600 mb-1">오류 횟수</p>
              <p className="text-2xl font-semibold text-gray-700">{errors}회</p>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            검사 결과는 디바이스 종류, 화면 크기, 컨디션에 따라 달라질 수 있으며 진단 도구가 아닙니다.
          </p>
          <button
            className="w-full mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition"
            onClick={reset}
          >
            다시 테스트하기
          </button>
        </div>
      )}
    </div>
  );
}
