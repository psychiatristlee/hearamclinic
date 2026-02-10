"use client";

import React, { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ApexOptions } from "apexcharts";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

interface GradientCircleChartProps {
  value: number;
  maxValue: number;
  result: string;
  color: string;
}

export default function GradientCircleChart({
  value,
  maxValue,
  result,
  color,
}: GradientCircleChartProps) {
  const [chartDimensions, setChartDimensions] = useState({
    width: 0,
    height: 0,
  });
  const [series] = useState<ApexOptions["series"]>([
    (value / maxValue) * 100,
  ]);
  const [options] = useState<ApexOptions>({
    plotOptions: {
      radialBar: {
        hollow: {
          size: "70%",
        },
        dataLabels: {
          name: {
            color: "#111",
          },
          value: {
            show: true,
            formatter: function (valueAsPercent) {
              return Math.round((Number(valueAsPercent) * maxValue) / 100).toString();
            },
          },
        },
      },
    },
    labels: [result],
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "horizontal",
        shadeIntensity: 0.5,
        gradientToColors: [color],
        inverseColors: true,
        opacityFrom: 1,
        opacityTo: 1,
        stops: [0, 100],
      },
    },
  });

  useEffect(() => {
    const handleResize = () => {
      const container = document.getElementById("chart-container");
      if (container) {
        setChartDimensions({
          width: container.offsetWidth,
          height: container.offsetHeight,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div id="chart-container" style={{ width: "100%", height: "400px" }}>
      <ReactApexChart
        options={options}
        series={series}
        type="radialBar"
        height={chartDimensions.height}
        width={chartDimensions.width}
      />
    </div>
  );
}
