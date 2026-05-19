"use client";

import { useMemo } from "react";
import {
  Legend,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type AlgorithmId, type AlgorithmData, ALGORITHM_LABELS } from "@/lib/dataset";

const ALGO_COLORS: Record<AlgorithmId, string> = {
  raw: "#f97316",
  fixed: "#2563eb",
  cm: "#16a34a",
  tinyml: "#7c3aed",
};

interface ChartPoint {
  timestamp_ms: number;
  gt_distance_mm: number;
  raw?: number;
  fixed?: number;
  cm?: number;
  tinyml?: number;
}

interface Props {
  algorithms: Partial<Record<AlgorithmId, AlgorithmData>>;
  title?: string;
  blockedIntervals?: { x1: number; x2: number }[];
}

export default function EstimateLineChart({ algorithms, title, blockedIntervals }: Props) {
  const { chartData, xTicks, activeAlgos } = useMemo(() => {
    const entries = (Object.entries(algorithms) as [AlgorithmId, AlgorithmData][]).filter(
      ([, v]) => v !== undefined
    );

    if (entries.length === 0) return { chartData: [], xTicks: undefined, activeAlgos: [] };

    const [, baseData] = entries[0];
    const map = new Map<number, ChartPoint>();
    baseData.rows.forEach((row) => {
      map.set(row.timestamp_ms, {
        timestamp_ms: row.timestamp_ms,
        gt_distance_mm: row.gt_distance_mm,
      });
    });

    entries.forEach(([algoId, data]) => {
      data.rows.forEach((row) => {
        const point = map.get(row.timestamp_ms);
        if (point) point[algoId] = row.kf_estimate_mm;
      });
    });

    const sorted = Array.from(map.values()).sort((a, b) => a.timestamp_ms - b.timestamp_ms);

    let ticks: number[] | undefined;
    if (sorted.length > 10) {
      const step = Math.floor(sorted.length / 8);
      ticks = [];
      for (let i = 0; i < sorted.length; i += step) ticks.push(sorted[i].timestamp_ms);
      const last = sorted[sorted.length - 1].timestamp_ms;
      if (ticks[ticks.length - 1] !== last) ticks.push(last);
    }

    return { chartData: sorted, xTicks: ticks, activeAlgos: entries.map(([id]) => id) };
  }, [algorithms]);

  return (
    <div className="space-y-3">
      {title ? <h4 className="text-sm font-semibold text-[#111827]">{title}</h4> : null}
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
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
            label={{ value: "distance (mm)", angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) => [
              typeof value === "number" ? `${value.toFixed(2)} mm` : value,
            ]}
            labelFormatter={(label) => `t = ${label} ms`}
          />
          <Legend verticalAlign="top" height={28} />
          {blockedIntervals?.map((interval, i) => (
            <ReferenceArea
              key={i}
              x1={interval.x1}
              x2={interval.x2}
              fill="#fee2e2"
              fillOpacity={0.6}
              strokeOpacity={0}
            />
          ))}
          <Line
            type="monotone"
            dataKey="gt_distance_mm"
            name="Ground Truth"
            stroke="#94a3b8"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            dot={false}
          />
          {activeAlgos.map((algoId) => (
            <Line
              key={algoId}
              type="monotone"
              dataKey={algoId}
              name={ALGORITHM_LABELS[algoId]}
              stroke={ALGO_COLORS[algoId]}
              strokeWidth={1.5}
              dot={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
