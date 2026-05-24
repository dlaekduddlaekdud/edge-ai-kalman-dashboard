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
import { useE1Store, E1_CHART_LINE_COLORS } from "@/lib/e1-store";
import { ALL_RUNS, RUN_LABELS, type RunId } from "@/lib/e1-csv-parser";
import { applyTrim } from "@/lib/e1-metrics";

interface ChartPoint {
  timestamp_ms: number;
  fixed_kalman_gain?: number;
  cm_kalman_gain?: number;
}

export default function KalmanGainChart() {
  const { runs, activeRun, selectedAlgorithms, autoExcludeStop, trimTail } = useE1Store();

  const showFixed = selectedAlgorithms.includes("fixed");
  const showCM = selectedAlgorithms.includes("cm");

  const { data, xTicks } = useMemo(() => {
    if (!showFixed && !showCM) return { data: [], xTicks: undefined };

    const runId = activeRun === "all"
      ? ALL_RUNS.find((r) => runs[r] !== undefined)
      : (activeRun as RunId);
    const runData = runId ? runs[runId] : undefined;
    if (!runData || runData.rows.length === 0) return { data: [], xTicks: undefined };

    const trimmed = applyTrim(runData.rows, autoExcludeStop, trimTail);
    if (trimmed.length === 0) return { data: [], xTicks: undefined };

    const points: ChartPoint[] = trimmed.map((r) => ({
      timestamp_ms: r.timestamp_ms,
      fixed_kalman_gain: showFixed ? r.fixed_kalman_gain : undefined,
      cm_kalman_gain: showCM ? r.cm_kalman_gain : undefined,
    }));

    let ticks: number[] | undefined;
    if (points.length > 10) {
      const step = Math.floor(points.length / 8);
      ticks = [];
      for (let i = 0; i < points.length; i += step) ticks.push(points[i].timestamp_ms);
      const last = points[points.length - 1].timestamp_ms;
      if (ticks[ticks.length - 1] !== last) ticks.push(last);
    }

    return { data: points, xTicks: ticks };
  }, [runs, activeRun, showFixed, showCM, autoExcludeStop, trimTail]);

  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-[#94a3b8]">
        {!showFixed && !showCM
          ? "Fixed KF 또는 CM-AKF 토글을 활성화하세요"
          : "데이터 없음"}
      </p>
    );
  }

  const displayedRunId = activeRun === "all"
    ? ALL_RUNS.find((r) => runs[r] !== undefined)
    : (activeRun as RunId);

  return (
    <div className="space-y-2">
      <p className="text-xl font-black text-[#111827]">
        차트 4 — Kalman Gain
        {activeRun === "all" && (
          <span className="ml-2 text-base font-semibold text-[#6b7280]">
            (All: {displayedRunId ? RUN_LABELS[displayedRunId] : "첫 run"} 표시)
          </span>
        )}
      </p>
      <ResponsiveContainer width="100%" height={320}>
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
            tick={{ fontSize: 15 }}
            label={{ value: "K (gain)", angle: -90, position: "insideLeft", offset: 10, fontSize: 15 }}
          />
          <Tooltip
            formatter={(v) => [typeof v === "number" ? v.toFixed(5) : v]}
            labelFormatter={(l) => `t = ${l} ms`}
          />
          <Legend verticalAlign="top" height={34} wrapperStyle={{ fontSize: 16, fontWeight: 700 }} />
          {showFixed && (
            <Line
              type="monotone"
              dataKey="fixed_kalman_gain"
              name="Fixed KF Gain"
              stroke={E1_CHART_LINE_COLORS.fixed}
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
            />
          )}
          {showCM && (
            <Line
              type="monotone"
              dataKey="cm_kalman_gain"
              name="CM-AKF Gain"
              stroke={E1_CHART_LINE_COLORS.cm}
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
