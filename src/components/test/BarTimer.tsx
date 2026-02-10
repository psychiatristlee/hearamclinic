"use client";

import { useEffect, useState } from "react";

interface BarTimerProps {
  hideBar: boolean;
  maxWidth: number;
  maxTime: number;
  handleTimeout: () => void;
}

export default function BarTimer({
  hideBar = false,
  maxTime,
  maxWidth,
  handleTimeout,
}: BarTimerProps) {
  const [fillWidth, setFillWidth] = useState<number>(0);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (fillWidth <= maxWidth) {
        setFillWidth((prevWidth) => prevWidth + maxWidth / 100);
      } else {
        clearInterval(intervalId);
      }
    }, maxTime / 100);

    return () => {
      clearInterval(intervalId);
      if (maxWidth === fillWidth) {
        handleTimeout();
      }
    };
  }, [fillWidth, handleTimeout, maxTime, maxWidth]);

  return (
    <div
      className={`bg-gray-200 h-4 rounded-full overflow-hidden ${
        hideBar ? "invisible" : ""
      }`}
      style={{ width: `${maxWidth}px` }}
    >
      <div
        className="bg-purple-500 h-full rounded-full transition-none"
        style={{ width: `${fillWidth}px` }}
      ></div>
    </div>
  );
}
