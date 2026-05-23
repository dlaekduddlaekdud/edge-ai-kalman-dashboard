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
  const { chartData, xTicks, activeAlgos, hasMismatch } = useMemo(() => {
    const entries = (Object.entries(algorithms) as [AlgorithmId, AlgorithmData][]).filter(
      ([, v]) => v !== undefined
    );

    if (entries.length === 0) {
      return { chartData: [], xTicks: undefined, activeAlgos: [], hasMismatch: false };
    }

    // 모든 알고리즘의 timestamp union으로 맵 초기화 (run 불일치 시 갭 처리)
    const map = new Map<number, ChartPoint>();
    entries.forEach(([, data]) => {
      data.rows.forEach((row) => {
        if (!map.has(row.timestamp_ms)) {
          map.set(row.timestamp_ms, {
            timestamp_ms: row.timestamp_ms,
            gt_distance_mm: row.gt_distance_mm,
          });
        }
      });
    });

    entries.forEach(([algoId, data]) => {
      data.rows.forEach((row) => {
        const point = map.get(row.timestamp_ms);
        if (point) {
          switch (algoId) {
            case "raw":    point[algoId] = row.tof_distance_mm; break;
            case "fixed":  point[algoId] = row.fixed_estimate_mm; break;
            case "cm":     point[algoId] = row.cm_estimate_mm; break;
            case "tinyml": if (row.tinyml_estimate_mm != null) point[algoId] = row.tinyml_estimate_mm; break;
          }
        }
      });
    });

    const sorted = Array.from(map.values()).sort((a, b) => a.timestamp_ms - b.timestamp_ms);

    // 알고리즘 간 timestamp 불일치 탐지 (50% 이상 갭 발생 시 경고)
    const mismatch = entries.some(([algoId, data]) => {
      const covered = data.rows.filter((r) => map.has(r.timestamp_ms)).length;
      const gap = 1 - covered / sorted.length;
      if (gap > 0.05) {
        console.warn(`[EstimateLineChart] ${algoId}: ${(gap * 100).toFixed(1)}% timestamp 불일치 — run이 다른 CSV일 수 있습니다.`);
        return true;
      }
      return false;
    });

    let ticks: number[] | undefined;
    if (sorted.length > 10) {
      const step = Math.floor(sorted.length / 8);
      ticks = [];
      for (let i = 0; i < sorted.length; i += step) ticks.push(sorted[i].timestamp_ms);
      const last = sorted[sorted.length - 1].timestamp_ms;
      if (ticks[ticks.length - 1] !== last) ticks.push(last);
    }

    return { chartData: sorted, xTicks: ticks, activeAlgos: entries.map(([id]) => id), hasMismatch: mismatch };
  }, [algorithms]);

  return (
    <div className="space-y-3">
      {title ? <h4 className="text-sm font-semibold text-[#111827]">{title}</h4> : null}
      {hasMismatch && (
        <p className="rounded-md border border-[#fecaca] bg-[#fff7f7] px-3 py-2 text-xs text-[#dc2626]">
          알고리즘 간 timestamp가 일치하지 않습니다. 동일 run의 CSV인지 확인하세요.
        </p>
      )}
      <ResponsiveContainer width="100%" height={360}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
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
