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
import { useE1Store, E1_ALGORITHM_LABELS, E1_CHART_LINE_COLORS } from "@/lib/e1-store";
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

function paddedDomain(values: number[]): [number, number] {
  if (values.length === 0) return [0, 600];
  const min = values.reduce((m, value) => Math.min(m, value), Infinity);
  const max = values.reduce((m, value) => Math.max(m, value), -Infinity);
  const span = Math.max(max - min, 1);
  const pad = Math.max(span * 0.04, 8);
  return [Math.max(0, Math.floor(min - pad)), Math.ceil(max + pad)];
}

export default function PositionChart() {
  const { runs, activeRun, selectedAlgorithms, hasTinyML, autoExcludeStop, trimTail } =
    useE1Store();

  const { data, xTicks, showGT, yDomain } = useMemo(() => {
    const runId = activeRun === "all"
      ? ALL_RUNS.find((r) => runs[r] !== undefined)
      : (activeRun as RunId);
    const runData = runId ? runs[runId] : undefined;
    if (!runData || runData.rows.length === 0) return { data: [], xTicks: undefined, showGT: false, yDomain: [0, 600] as [number, number] };

    const trimmed = applyTrim(runData.rows, autoExcludeStop, trimTail);
    if (trimmed.length === 0) return { data: [], xTicks: undefined, showGT: false, yDomain: [0, 600] as [number, number] };

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

    const yValues = points.flatMap((point) =>
      [showGT ? point.gt : undefined, point.raw, point.fixed, point.cm, point.tinyml]
        .filter((value): value is number => typeof value === "number" && Number.isFinite(value)),
    );

    return { data: points, xTicks: ticks, showGT, yDomain: paddedDomain(yValues) };
  }, [runs, activeRun, selectedAlgorithms, hasTinyML, autoExcludeStop, trimTail]);

  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-[#94a3b8]">데이터 없음</p>
    );
  }

  const activeAlgos = (["raw", "fixed", "cm", "tinyml"] as const).filter(
    (id) => selectedAlgorithms.includes(id) && (id !== "tinyml" || hasTinyML),
  );
  const legendItems = [
    ...activeAlgos.map((id) => ({
      value: E1_ALGORITHM_LABELS[id],
      type: "line" as const,
      color: E1_CHART_LINE_COLORS[id],
      id,
    })),
    ...(showGT
      ? [{ value: "GT", type: "line" as const, color: "#94a3b8", id: "gt" }]
      : []),
  ];
  const displayedRunId = activeRun === "all"
    ? ALL_RUNS.find((r) => runs[r] !== undefined)
    : (activeRun as RunId);

  return (
    <div className="space-y-2">
      <p className="text-xl font-black text-[#111827]">
        차트 1 — 위치 추정 (Raw · Fixed · CM · TinyML)
        {activeRun === "all" && (
          <span className="ml-2 text-base font-semibold text-[#6b7280]">
            (All: 메트릭은 평균, 차트는 {displayedRunId ? RUN_LABELS[displayedRunId] : "첫 run"} 표시)
          </span>
        )}
      </p>
      <ResponsiveContainer width="100%" height={500}>
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
          {/* CM → Fixed → TinyML → Raw 순으로 렌더 */}
          {(["cm", "fixed", "tinyml", "raw"] as const)
            .filter((id) => activeAlgos.includes(id))
            .map((id) => (
              <Line
                key={id}
                type="monotone"
                dataKey={id}
                name={E1_ALGORITHM_LABELS[id]}
                stroke={E1_CHART_LINE_COLORS[id]}
                strokeWidth={id === "raw" ? 1 : 1.5}
                strokeOpacity={id === "raw" ? 0.45 : 1}
                dot={false}
                connectNulls={false}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
