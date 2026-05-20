"use client";

import { useMemo } from "react";
import {
  Line,
  LineChart,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useE1Store, E1_ALGORITHM_COLORS } from "@/lib/e1-store";
import { ALL_RUNS, type RunId } from "@/lib/e1-csv-parser";
import { applyTrim } from "@/lib/e1-metrics";

interface ChartPoint {
  timestamp_ms: number;
  fixed_residual?: number;
  cm_residual?: number;
}

export default function ResidualChart() {
  const { runs, activeRun, selectedAlgorithms, autoExcludeStop, trimTail } = useE1Store();

  const { data, xTicks } = useMemo(() => {
    const runId = activeRun === "all"
      ? ALL_RUNS.find((r) => runs[r] !== undefined)
      : (activeRun as RunId);
    const runData = runId ? runs[runId] : undefined;
    if (!runData || runData.rows.length === 0) return { data: [], xTicks: undefined };

    const trimmed = applyTrim(runData.rows, autoExcludeStop, trimTail);
    if (trimmed.length === 0) return { data: [], xTicks: undefined };

    const showFixed = selectedAlgorithms.includes("fixed");
    const showCM = selectedAlgorithms.includes("cm");

    const points: ChartPoint[] = trimmed.map((r) => ({
      timestamp_ms: r.timestamp_ms,
      fixed_residual: showFixed ? r.fixed_residual : undefined,
      cm_residual: showCM ? r.cm_residual : undefined,
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
    return <p className="py-4 text-center text-sm text-[#94a3b8]">데이터 없음</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-[#64748b]">차트 2 — 잔차 (Residual)</p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
          <XAxis
            dataKey="timestamp_ms"
            ticks={xTicks}
            tick={{ fontSize: 11 }}
            tickFormatter={(v: number) => String(v)}
            label={{ value: "timestamp (ms)", position: "insideBottom", offset: -2, fontSize: 11 }}
            height={40}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            label={{ value: "residual (mm)", angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }}
          />
          <Tooltip
            formatter={(v) => [typeof v === "number" ? `${v.toFixed(3)} mm` : v]}
            labelFormatter={(l) => `t = ${l} ms`}
          />
          <Legend verticalAlign="top" height={28} />
          <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 2" />
          {selectedAlgorithms.includes("fixed") && (
            <Line
              type="monotone"
              dataKey="fixed_residual"
              name="Fixed KF 잔차"
              stroke={E1_ALGORITHM_COLORS.fixed}
              strokeWidth={1.2}
              dot={false}
              connectNulls={false}
            />
          )}
          {selectedAlgorithms.includes("cm") && (
            <Line
              type="monotone"
              dataKey="cm_residual"
              name="CM-AKF 잔차"
              stroke={E1_ALGORITHM_COLORS.cm}
              strokeWidth={1.2}
              dot={false}
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
