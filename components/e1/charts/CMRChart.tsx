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
import { useE1Store, E1_ALGORITHM_COLORS } from "@/lib/e1-store";
import { ALL_RUNS, RUN_LABELS, type RunId } from "@/lib/e1-csv-parser";
import { applyTrim } from "@/lib/e1-metrics";

interface ChartPoint {
  timestamp_ms: number;
  cm_R: number;
  cm_residual_var?: number | null;
}

export default function CMRChart() {
  const { runs, activeRun, selectedAlgorithms, autoExcludeStop, trimTail } = useE1Store();

  const { data, xTicks } = useMemo(() => {
    if (!selectedAlgorithms.includes("cm")) return { data: [], xTicks: undefined };

    const runId = activeRun === "all"
      ? ALL_RUNS.find((r) => runs[r] !== undefined)
      : (activeRun as RunId);
    const runData = runId ? runs[runId] : undefined;
    if (!runData || runData.rows.length === 0) return { data: [], xTicks: undefined };

    const trimmed = applyTrim(runData.rows, autoExcludeStop, trimTail);
    if (trimmed.length === 0) return { data: [], xTicks: undefined };

    const points: ChartPoint[] = trimmed.map((r) => ({
      timestamp_ms: r.timestamp_ms,
      cm_R: r.cm_R,
      cm_residual_var: r.cm_residual_var,
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
  }, [runs, activeRun, selectedAlgorithms, autoExcludeStop, trimTail]);

  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-[#94a3b8]">
        {selectedAlgorithms.includes("cm") ? "데이터 없음" : "CM-AKF 토글을 활성화하세요"}
      </p>
    );
  }

  const hasResidualVar = data.some((d) => d.cm_residual_var != null);
  const displayedRunId = activeRun === "all"
    ? ALL_RUNS.find((r) => runs[r] !== undefined)
    : (activeRun as RunId);

  return (
    <div className="space-y-2">
      <p className="text-2xl font-black text-[#111827]">
        차트 3 — CM-R 적응 노이즈 추정
        {activeRun === "all" && (
          <span className="ml-2 text-base font-semibold text-[#6b7280]">
            (All: {displayedRunId ? RUN_LABELS[displayedRunId] : "첫 run"} 표시)
          </span>
        )}
      </p>
      <ResponsiveContainer width="100%" height={310}>
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
            domain={["dataMin - 2", "dataMax + 2"]}
            tick={{ fontSize: 15 }}
            label={{ value: "value", angle: -90, position: "insideLeft", offset: 10, fontSize: 15 }}
          />
          <Tooltip
            formatter={(v) => [typeof v === "number" ? v.toFixed(4) : v]}
            labelFormatter={(l) => `t = ${l} ms`}
          />
          <Legend verticalAlign="top" height={34} wrapperStyle={{ fontSize: 16, fontWeight: 700 }} />
          <Line
            type="monotone"
            dataKey="cm_R"
            name="cm_R (적응 노이즈)"
            stroke={E1_ALGORITHM_COLORS.cm}
            strokeWidth={3}
            dot={false}
          />
          {hasResidualVar && (
            <Line
              type="monotone"
              dataKey="cm_residual_var"
              name="cm_residual_var"
              stroke="#94a3b8"
              strokeWidth={1.5}
              strokeDasharray="4 2"
              dot={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
