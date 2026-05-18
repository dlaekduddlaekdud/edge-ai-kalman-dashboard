"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useKFStore } from "@/lib/store";
import { calculateMAE, calculateRMSE } from "@/lib/metrics";

const FEATURE_SETS = ["6-feature", "5-feature", "3-feature"] as const;

export default function AblationPage() {
  const { rows, fileName } = useKFStore();

  const currentMetrics = useMemo(() => {
    if (rows.length === 0) return null;
    const estimates = rows.map((r) => r.kf_estimate_mm);
    const gt = rows.map((r) => r.gt_distance_mm);

    let rmse: number | null = null;
    let mae: number | null = null;

    try { rmse = calculateRMSE(estimates, gt); } catch { /* empty */ }
    try { mae = calculateMAE(estimates, gt); } catch { /* empty */ }

    return { rmse, mae, rowCount: rows.length };
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
            Ablation
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[#111827]">
            Feature set 비교
          </h2>
        </section>
        <section className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-6 shadow-sm">
          <p className="text-base font-semibold text-[#92400e]">
            업로드된 CSV가 없습니다.
          </p>
          <p className="mt-2 text-sm text-[#78350f]">
            먼저 실험 CSV를 업로드해야 메트릭을 확인할 수 있습니다.
          </p>
          <Link
            href="/upload"
            className="mt-4 inline-block rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
          >
            CSV 업로드하러 가기
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
          Ablation
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[#111827]">
          Feature set 비교
        </h2>
        <p className="mt-2 text-sm text-[#64748b]">
          파일:{" "}
          <span className="font-medium text-[#334155]">{fileName}</span>
          &ensp;·&ensp;전체 row:{" "}
          <span className="font-medium text-[#334155]">{rows.length}</span>
        </p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#64748b]">
          feature set별 비교는 각각 별도 CSV를 업로드해야 합니다. 현재는
          업로드된 CSV 기준의 전체 메트릭을 첫 번째 카드에 표시합니다.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {FEATURE_SETS.map((featureSet, index) => {
          const isCurrent = index === 0;
          return (
            <div
              key={featureSet}
              className={`rounded-lg border p-5 shadow-sm ${
                isCurrent
                  ? "border-[#bfdbfe] bg-white"
                  : "border-[#d9e0ea] bg-[#f8fafc]"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#111827]">
                  {featureSet}
                </h3>
                {isCurrent ? (
                  <span className="rounded-full bg-[#dbeafe] px-2 py-0.5 text-xs font-semibold text-[#1d4ed8]">
                    현재 CSV
                  </span>
                ) : null}
              </div>

              {isCurrent && currentMetrics ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-xs text-[#64748b]">RMSE</p>
                    <p className="mt-1 text-xl font-semibold text-[#111827]">
                      {currentMetrics.rmse != null
                        ? `${currentMetrics.rmse.toFixed(2)} mm`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b]">MAE</p>
                    <p className="mt-1 text-xl font-semibold text-[#111827]">
                      {currentMetrics.mae != null
                        ? `${currentMetrics.mae.toFixed(2)} mm`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#64748b]">Row count</p>
                    <p className="mt-1 text-xl font-semibold text-[#111827]">
                      {currentMetrics.rowCount}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="text-sm text-[#94a3b8]">
                    별도 CSV 업로드 필요
                  </p>
                  <Link
                    href="/upload"
                    className="mt-3 inline-block text-sm font-medium text-[#2563eb] hover:underline"
                  >
                    CSV 업로드하기 →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
