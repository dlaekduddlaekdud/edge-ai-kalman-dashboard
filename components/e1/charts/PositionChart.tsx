"use client";

import { useMemo } from "react";
import {
  Line,
  LineChart,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useE1Store, E1_ALGORITHM_COLORS, E1_ALGORITHM_LABELS } from "@/lib/e1-store";
import { ALL_RUNS, RUN_LABELS, type RunId } from "@/lib/e1-csv-parser";
import { applyTrim, getGroundTruth } from "@/lib/e1-metrics";

interface ChartPoint {
  timestamp_ms: number;
  gt: number;
  raw?: number;
  fixed?: number;
  cm?: number;
  tinyml?: number;
}

export default function PositionChart() {
  const { runs, activeRun, selectedAlgorithms, hasTinyML, autoExcludeStop, trimTail } =
    useE1Store();

  const { data, xTicks, showGT } = useMemo(() => {
    const runId = activeRun === "all"
      ? ALL_RUNS.find((r) => runs[r] !== undefined)
      : (activeRun as RunId);
    const runData = runId ? runs[runId] : undefined;
    if (!runData || runData.rows.length === 0) return { data: [], xTicks: undefined, showGT: false };

    const trimmed = applyTrim(runData.rows, autoExcludeStop, trimTail);
    if (trimmed.length === 0) return { data: [], xTicks: undefined, showGT: false };

    const gt = getGroundTruth(trimmed);
    // 데모 CSV는 gt=0 → GT 라인 숨김
    const showGT = gt.some((v) => v !== 0);
    const points: ChartPoint[] = trimmed.map((r, i) => ({
      timestamp_ms: r.timestamp_ms,
      gt: gt[i],
      raw: selectedAlgorithms.includes("raw") ? r.tof_distance_mm : undefined,
      fixed: selectedAlgorithms.includes("fixed") ? r.fixed_estimate_mm : undefined,
      cm: selectedAlgorithms.includes("cm") ? r.cm_estimate_mm : undefined,
      tinyml:
        selectedAlgorithms.includes("tinyml") && hasTinyML && r.tinyml_estimate_mm !== undefined
          ? r.tinyml_estimate_mm
          : undefined,
    }));

    let ticks: number[] | undefined;
    if (points.length > 10) {
      const step = Math.floor(points.length / 8);
      ticks = [];
      for (let i = 0; i < points.length; i += step) ticks.push(points[i].timestamp_ms);
      const last = points[points.length - 1].timestamp_ms;
      if (ticks[ticks.length - 1] !== last) ticks.push(last);
    }

    return { data: points, xTicks: ticks, showGT };
  }, [runs, activeRun, selectedAlgorithms, hasTinyML, autoExcludeStop, trimTail]);

  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-[#94a3b8]">데이터 없음</p>
    );
  }

  const activeAlgos = (["raw", "fixed", "cm", "tinyml"] as const).filter(
    (id) => selectedAlgorithms.includes(id) && (id !== "tinyml" || hasTinyML),
  );
  const displayedRunId = activeRun === "all"
    ? ALL_RUNS.find((r) => runs[r] !== undefined)
    : (activeRun as RunId);

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[#64748b]">
        차트 1 — 위치 추정 (GT · Raw · Fixed · CM)
        {activeRun === "all" && (
          <span className="ml-1.5 font-normal text-[#94a3b8]">
            (All: 메트릭은 평균, 차트는 {displayedRunId ? RUN_LABELS[displayedRunId] : "첫 run"} 표시)
          </span>
        )}
      </p>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <XAxis
            dataKey="timestamp_ms"
            ticks={xTicks}
            tick={{ fontSize: 13 }}
            tickFormatter={(v: number) => String(v)}
            label={{ value: "timestamp (ms)", position: "insideBottom", offset: -2, fontSize: 13 }}
            height={40}
          />
          <YAxis
            tick={{ fontSize: 13 }}
            label={{ value: "distance (mm)", angle: -90, position: "insideLeft", offset: 10, fontSize: 13 }}
          />
          <Tooltip
            formatter={(v) => [typeof v === "number" ? `${v.toFixed(2)} mm` : v]}
            labelFormatter={(l) => `t = ${l} ms`}
          />
          <Legend verticalAlign="top" height={28} />
          {showGT && (
            <Line
              type="monotone"
              dataKey="gt"
              name="GT"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
              connectNulls={false}
            />
          )}
          {activeAlgos.map((id) => (
            <Line
              key={id}
              type="monotone"
              dataKey={id}
              name={E1_ALGORITHM_LABELS[id]}
              stroke={E1_ALGORITHM_COLORS[id]}
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
