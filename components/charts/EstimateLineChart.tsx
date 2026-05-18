"use client";

import { useMemo } from "react";
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { type KFRow } from "@/lib/csv-parser";

interface Props {
  data: KFRow[];
  title?: string;
}

export default function EstimateLineChart({ data, title }: Props) {
  // 데이터가 많을 때 X축 tick을 약 8개로 줄임
  const xTicks = useMemo(() => {
    if (data.length <= 10) return undefined;
    const step = Math.floor(data.length / 8);
    const ticks: number[] = [];
    for (let i = 0; i < data.length; i += step) {
      ticks.push(data[i].timestamp_ms);
    }
    const last = data[data.length - 1].timestamp_ms;
    if (ticks[ticks.length - 1] !== last) ticks.push(last);
    return ticks;
  }, [data]);

  return (
    <div className="space-y-3">
      {title ? (
        <h4 className="text-sm font-semibold text-[#111827]">{title}</h4>
      ) : null}
      <ResponsiveContainer width="100%" height={360}>
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
            label={{ value: "distance (mm)", angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }}
          />
          <Tooltip
            formatter={(value) => [
              typeof value === "number" ? `${value.toFixed(2)} mm` : value,
            ]}
            labelFormatter={(label) => `t = ${label} ms`}
          />
          <Legend verticalAlign="top" height={28} />
          {/* Ground Truth를 먼저 선언해서 Legend 왼쪽에 표시 */}
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
  );
}
