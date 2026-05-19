"use client";

import { useMemo } from "react";
import { type AlgorithmId, type AlgorithmData, ALGORITHM_LABELS } from "@/lib/dataset";
import { calculateMAE, calculateRMSE } from "@/lib/metrics";
import { type KFRow } from "@/lib/csv-parser";
import EstimateLineChart from "@/components/charts/EstimateLineChart";

interface Props {
  algorithms: Partial<Record<AlgorithmId, AlgorithmData>>;
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
      Math.abs(row.tof_distance_mm - row.gt_distance_mm) / row.gt_distance_mm > 0.3;

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

export default function E3View({ algorithms }: Props) {
  const { metricRows, blockedIntervals } = useMemo(() => {
    const entries = (Object.entries(algorithms) as [AlgorithmId, AlgorithmData][]).filter(
      ([, v]) => v !== undefined
    );

    // raw가 있으면 raw 기준, 없으면 첫 번째 알고리즘 기준으로 차단 구간 탐지
    const source = algorithms.raw ?? entries[0]?.[1];
    const intervals = source ? detectBlockedIntervals(source.rows) : [];

    const rows = entries.map(([algoId, data]) => {
      const estimates = data.rows.map((r) => r.kf_estimate_mm);
      const gt = data.rows.map((r) => r.gt_distance_mm);
      const errors = estimates.map((e, i) => Math.abs(e - gt[i]));

      let rmse: number | null = null;
      let mae: number | null = null;
      const maxError = errors.length > 0 ? Math.max(...errors) : null;

      try { rmse = calculateRMSE(estimates, gt); } catch { /* empty */ }
      try { mae = calculateMAE(estimates, gt); } catch { /* empty */ }

      return { algoId, rmse, mae, maxError };
    });

    return { metricRows: rows, blockedIntervals: intervals };
  }, [algorithms]);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-lg border border-[#d9e0ea] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-[#f8fafc]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-[#475569]">알고리즘</th>
              <th className="px-4 py-3 text-right font-semibold text-[#475569]">RMSE</th>
              <th className="px-4 py-3 text-right font-semibold text-[#475569]">MAE</th>
              <th className="px-4 py-3 text-right font-semibold text-[#475569]">Max Error</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {metricRows.map(({ algoId, rmse, mae, maxError }) => (
              <tr key={algoId}>
                <td className="px-4 py-3 font-medium text-[#111827]">
                  {ALGORITHM_LABELS[algoId]}
                </td>
                <td className="px-4 py-3 text-right text-[#111827]">
                  {rmse != null ? `${rmse.toFixed(2)} mm` : "—"}
                </td>
                <td className="px-4 py-3 text-right text-[#111827]">
                  {mae != null ? `${mae.toFixed(2)} mm` : "—"}
                </td>
                <td className="px-4 py-3 text-right text-[#111827]">
                  {maxError != null ? `${maxError.toFixed(2)} mm` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-[#64748b]">
        차단 구간 {blockedIntervals.length}개
        <span className="ml-2 inline-block h-2 w-4 rounded-sm bg-[#fee2e2]" />
        <span className="ml-1">ToF 차단 구간 (30% 이상 오차)</span>
      </p>
      <EstimateLineChart
        algorithms={algorithms}
        title="E3 — KF Estimate vs Ground Truth"
        blockedIntervals={blockedIntervals}
      />
    </div>
  );
}
