"use client";

import { useMemo } from "react";
import { type KFRow } from "@/lib/csv-parser";
import { calculateMAE, calculateNISPassRate, calculateRMSE } from "@/lib/metrics";
import EstimateLineChart from "@/components/charts/EstimateLineChart";

interface Props {
  rows: KFRow[];
}

export default function E1View({ rows }: Props) {
  const metrics = useMemo(() => {
    if (rows.length === 0) return null;

    const estimates = rows.map((r) => r.kf_estimate_mm);
    const gt = rows.map((r) => r.gt_distance_mm);
    const validPairs = rows
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

    return { rmse, mae, nis };
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
      label: "NIS pass rate",
      value:
        metrics?.nis != null
          ? `${(metrics.nis * 100).toFixed(1)}%`
          : "—",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
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
      <EstimateLineChart data={rows} title="E1 — KF Estimate vs Ground Truth" />
    </div>
  );
}
