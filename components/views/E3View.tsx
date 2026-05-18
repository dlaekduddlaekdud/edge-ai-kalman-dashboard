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
import { type KFRow } from "@/lib/csv-parser";
import { calculateMAE, calculateRMSE } from "@/lib/metrics";

interface Props {
  rows: KFRow[];
}

interface BlockedInterval {
  x1: number;
  x2: number;
}

/** tof_distance_mm이 gt 대비 30% 이상 벗어나는 연속 구간을 탐지 */
function detectBlockedIntervals(rows: KFRow[]): BlockedInterval[] {
  const intervals: BlockedInterval[] = [];
  let inBlocked = false;
  let blockStart = 0;

  for (const row of rows) {
    const isBlocked =
      row.gt_distance_mm > 0 &&
      Math.abs(row.tof_distance_mm - row.gt_distance_mm) / row.gt_distance_mm >
        0.3;

    if (isBlocked && !inBlocked) {
      inBlocked = true;
      blockStart = row.timestamp_ms;
    } else if (!isBlocked && inBlocked) {
      inBlocked = false;
      intervals.push({ x1: blockStart, x2: row.timestamp_ms });
    }
  }

  if (inBlocked && rows.length > 0) {
    intervals.push({ x1: blockStart, x2: rows[rows.length - 1].timestamp_ms });
  }

  return intervals;
}

export default function E3View({ rows }: Props) {
  const xTicks = useMemo(() => {
    if (rows.length <= 10) return undefined;
    const step = Math.floor(rows.length / 8);
    const ticks: number[] = [];
    for (let i = 0; i < rows.length; i += step) {
      ticks.push(rows[i].timestamp_ms);
    }
    const last = rows[rows.length - 1].timestamp_ms;
    if (ticks[ticks.length - 1] !== last) ticks.push(last);
    return ticks;
  }, [rows]);

  const blockedIntervals = useMemo(() => detectBlockedIntervals(rows), [rows]);

  const metrics = useMemo(() => {
    if (rows.length === 0) return null;

    const estimates = rows.map((r) => r.kf_estimate_mm);
    const gt = rows.map((r) => r.gt_distance_mm);

    let rmse: number | null = null;
    let mae: number | null = null;
    let maxError: number | null = null;

    try { rmse = calculateRMSE(estimates, gt); } catch { /* empty */ }
    try { mae = calculateMAE(estimates, gt); } catch { /* empty */ }

    const errors = estimates.map((e, i) => Math.abs(e - gt[i]));
    maxError = errors.length > 0 ? Math.max(...errors) : null;

    return { rmse, mae, maxError };
  }, [rows]);

  const cards = [
    {
      label: "RMSE",
      value: metrics?.rmse != null ? `${metrics.rmse.toFixed(2)} mm` : "—",
    },
    {
      label: "MAE",
      value: metrics?.mae != null ? `${metrics.mae.toFixed(2)} mm` : "—",
    },
    {
      label: "Max Error",
      value:
        metrics?.maxError != null ? `${metrics.maxError.toFixed(2)} mm` : "—",
    },
    {
      label: "차단 구간 수",
      value: String(blockedIntervals.length),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-lg border border-[#d9e0ea] bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-[#64748b]">{card.label}</p>
            <p className="mt-2 text-xl font-semibold text-[#111827]">
              {card.value}
            </p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold text-[#111827]">
          E3 — KF Estimate vs Ground Truth
          <span className="ml-2 text-xs font-normal text-[#ef4444]">
            (빨간 영역: ToF 차단 구간)
          </span>
        </h4>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart
            data={rows}
            margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
          >
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
            {blockedIntervals.map((interval, i) => (
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
              stroke="#16a34a"
              strokeWidth={1.5}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="kf_estimate_mm"
              name="KF Estimate"
              stroke="#2563eb"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
