"use client";

import { useMemo } from "react";
import { type AlgorithmId, type AlgorithmData, ALGORITHM_LABELS } from "@/lib/dataset";
import { calculateMAE, calculateNISPassRate, calculateRMSE } from "@/lib/metrics";
import EstimateLineChart from "@/components/charts/EstimateLineChart";

interface Props {
  algorithms: Partial<Record<AlgorithmId, AlgorithmData>>;
}

export default function E1View({ algorithms }: Props) {
  const metricRows = useMemo(() => {
    return (Object.entries(algorithms) as [AlgorithmId, AlgorithmData][])
      .filter(([, v]) => v !== undefined)
      .map(([algoId, data]) => {
        const estimates = data.rows.map((r) => r.kf_estimate_mm);
        const gt = data.rows.map((r) => r.gt_distance_mm);
        const validPairs = data.rows
          .map((r) => ({ nu: r.tof_residual, s: r.innovation_cov }))
          .filter(({ s }) => s > 0);

        let rmse: number | null = null;
        let mae: number | null = null;
        let nis: number | null = null;

        try { rmse = calculateRMSE(estimates, gt); } catch { /* empty */ }
        try { mae = calculateMAE(estimates, gt); } catch { /* empty */ }
        try {
          if (validPairs.length > 0) {
            nis = calculateNISPassRate(
              validPairs.map((p) => p.nu),
              validPairs.map((p) => p.s),
            );
          }
        } catch { /* empty */ }

        return { algoId, rmse, mae, nis };
      });
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
              <th className="px-4 py-3 text-right font-semibold text-[#475569]">NIS pass rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {metricRows.map(({ algoId, rmse, mae, nis }) => (
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
                  {nis != null ? `${(nis * 100).toFixed(1)}%` : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <EstimateLineChart algorithms={algorithms} title="E1 — KF Estimate vs Ground Truth" />
    </div>
  );
}
