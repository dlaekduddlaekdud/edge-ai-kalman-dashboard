"use client";

import {
  Line,
  LineChart,
  Legend,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  E1_ALGORITHM_LABELS,
  E1_CHART_LINE_COLORS,
  type E1AlgorithmId,
} from "@/lib/e1-store";
import { RUN_LABELS, type RunId } from "@/lib/e1-csv-parser";
import type { BlockedInterval, ChartPoint } from "@/lib/e3-blocking";

const GT_COLOR = "#94a3b8";

/** CM → Fixed → TinyML → Raw 순서: 두꺼운 CM을 바닥에, 얇은 Raw를 맨 위에 그린다. */
const DRAW_ORDER = ["cm", "fixed", "tinyml", "raw"] as const;

interface Props {
  data: ChartPoint[];
  xTicks: number[] | undefined;
  yDomain: [number, number];
  activeAlgos: E1AlgorithmId[];
  blockedIntervals: BlockedInterval[];
  showGT: boolean;
  isAllRuns: boolean;
  displayedRunId: RunId | undefined;
}

export default function E3PositionChart({
  data,
  xTicks,
  yDomain,
  activeAlgos,
  blockedIntervals,
  showGT,
  isAllRuns,
  displayedRunId,
}: Props) {
  const legendItems = [
    ...activeAlgos.map((id) => ({
      value: E1_ALGORITHM_LABELS[id],
      color: E1_CHART_LINE_COLORS[id],
      id: id as string,
    })),
    ...(showGT ? [{ value: "GT", color: GT_COLOR, id: "gt" }] : []),
  ];

  return (
    <div className="rounded-lg border border-[#d1d5db] bg-white p-5 shadow-sm">
      <p className="text-2xl font-black text-[#111827]">
        차트 — E3 위치 추정 (GT · Raw · Fixed · CM
        {activeAlgos.includes("tinyml") ? " · TinyML" : ""})
        {isAllRuns && (
          <span className="ml-2 text-base font-semibold text-[#6b7280]">
            (All: 메트릭은 평균, 차트는 {displayedRunId ? RUN_LABELS[displayedRunId] : "첫 run"} 표시)
          </span>
        )}
      </p>
      <div className="mt-3">
        <ResponsiveContainer width="100%" height={380}>
          <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <XAxis
              dataKey="timestamp_ms"
              ticks={xTicks}
              tick={{ fontSize: 15 }}
              tickFormatter={(v: number) => String(v)}
              label={{ value: "timestamp (ms)", position: "insideBottom", offset: -2, fontSize: 15 }}
              height={46}
            />
            <YAxis
              domain={yDomain}
              tick={{ fontSize: 15 }}
              label={{ value: "distance (mm)", angle: -90, position: "insideLeft", offset: 10, fontSize: 15 }}
            />
            <Tooltip
              formatter={(v) => [typeof v === "number" ? `${v.toFixed(2)} mm` : v]}
              labelFormatter={(l) => `t = ${l} ms`}
            />
            <Legend
              verticalAlign="top"
              height={32}
              content={() => (
                <div className="flex flex-wrap justify-center gap-5 text-base font-bold text-[#374151]">
                  {legendItems.map((item) => (
                    <span key={item.id} className="inline-flex items-center gap-1.5">
                      <span
                        className="inline-block h-2.5 w-5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      {item.value}
                    </span>
                  ))}
                </div>
              )}
            />
            {blockedIntervals.map((interval, i) => (
              <ReferenceArea
                key={i}
                x1={interval.x1}
                x2={interval.x2}
                fill="#fee2e2"
                fillOpacity={0.45}
                strokeOpacity={0}
              />
            ))}
            {showGT && (
              <Line
                type="monotone"
                dataKey="gt"
                name="GT"
                stroke={GT_COLOR}
                strokeWidth={2}
                strokeDasharray="4 2"
                dot={false}
                connectNulls={false}
              />
            )}
            {DRAW_ORDER.filter((id) => activeAlgos.includes(id)).map((algoId) => (
              <Line
                key={algoId}
                type="monotone"
                dataKey={algoId}
                name={E1_ALGORITHM_LABELS[algoId]}
                stroke={E1_CHART_LINE_COLORS[algoId]}
                strokeWidth={algoId === "raw" ? 1 : 1.5}
                strokeOpacity={algoId === "raw" ? 0.45 : 1}
                dot={false}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
