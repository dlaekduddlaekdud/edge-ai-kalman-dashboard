"use client";

import { useState } from "react";
import Link from "next/link";
import { useKFStore } from "@/lib/store";
import {
  calculateMAE,
  calculateNISPassRate,
  calculateRMSE,
} from "@/lib/metrics";
import EstimateLineChart from "@/components/charts/EstimateLineChart";
import E1View from "@/components/views/E1View";
import E3View from "@/components/views/E3View";
import { type ScenarioId } from "@/lib/csv-parser";

function formatMetric(value: number | null, decimals = 2): string {
  if (value === null) return "—";
  return value.toFixed(decimals);
}

export default function DashboardPage() {
  const { rows, fileName, scenarioIds } = useKFStore();
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId | null>(
    null,
  );

  // 데이터 없을 때 안내 UI
  if (rows.length === 0) {
    return (
      <div className="space-y-6">
        <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
            Dashboard
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[#111827]">
            시나리오별 분석 대시보드
          </h2>
        </section>
        <section className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-6 shadow-sm">
          <p className="text-base font-semibold text-[#92400e]">
            업로드된 CSV가 없습니다.
          </p>
          <p className="mt-2 text-sm text-[#78350f]">
            먼저 실험 CSV를 업로드해야 대시보드를 확인할 수 있습니다.
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

  // 선택된 시나리오가 없으면 첫 번째 시나리오를 기본 선택
  const activeScenario = selectedScenario ?? scenarioIds[0] ?? null;

  const filteredRows =
    activeScenario !== null
      ? rows.filter((row) => String(row.scenario_id) === String(activeScenario))
      : [];

  // 메트릭 계산 (null-safe)
  let rmse: number | null = null;
  let mae: number | null = null;
  let nisPassRate: number | null = null;

  if (filteredRows.length > 0) {
    const estimates = filteredRows.map((r) => r.kf_estimate_mm);
    const gt = filteredRows.map((r) => r.gt_distance_mm);
    const nu = filteredRows.map((r) => r.tof_residual);
    const S = filteredRows.map((r) => r.innovation_cov);

    try {
      rmse = calculateRMSE(estimates, gt);
    } catch {
      rmse = null;
    }
    try {
      mae = calculateMAE(estimates, gt);
    } catch {
      mae = null;
    }
    try {
      // innovation_cov가 0 이하인 row가 있을 수 있으므로 방어적으로 처리
      const validPairs = nu
        .map((n, i) => ({ n, s: S[i] }))
        .filter(({ s }) => s > 0);
      if (validPairs.length > 0) {
        nisPassRate = calculateNISPassRate(
          validPairs.map((p) => p.n),
          validPairs.map((p) => p.s),
        );
      }
    } catch {
      nisPassRate = null;
    }
  }

  const metrics = [
    { label: "RMSE", value: rmse !== null ? `${formatMetric(rmse)} mm` : "—" },
    { label: "MAE", value: mae !== null ? `${formatMetric(mae)} mm` : "—" },
    {
      label: "NIS pass rate",
      value:
        nisPassRate !== null
          ? `${(nisPassRate * 100).toFixed(1)}%`
          : "—",
    },
    { label: "Row count", value: String(filteredRows.length) },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
          Dashboard
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[#111827]">
          시나리오별 분석 대시보드
        </h2>
        <p className="mt-2 text-sm text-[#64748b]">
          파일: <span className="font-medium text-[#334155]">{fileName}</span>
          &ensp;·&ensp;전체 row:{" "}
          <span className="font-medium text-[#334155]">{rows.length}</span>
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">
              Scenario Selector
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {scenarioIds.map((scenarioId) => {
                const isActive =
                  String(activeScenario) === String(scenarioId);
                return (
                  <button
                    key={String(scenarioId)}
                    type="button"
                    onClick={() => setSelectedScenario(scenarioId)}
                    className={`rounded-md border px-3 py-2 text-center text-sm font-medium transition ${
                      isActive
                        ? "border-[#2563eb] bg-[#dbeafe] text-[#1d4ed8]"
                        : "border-[#d9e0ea] text-[#334155] hover:border-[#2563eb] hover:text-[#1d4ed8]"
                    }`}
                  >
                    {scenarioId}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-lg border border-[#d9e0ea] bg-white p-4 shadow-sm"
              >
                <p className="text-sm text-[#64748b]">{metric.label}</p>
                <p className="mt-2 text-xl font-semibold text-[#111827]">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#111827]">
              Chart Area
              {activeScenario !== null ? (
                <span className="ml-2 text-sm font-normal text-[#64748b]">
                  — Scenario {activeScenario}
                </span>
              ) : null}
            </h3>
            <div className="mt-4">
              {filteredRows.length === 0 ? (
                <div className="flex min-h-72 items-center justify-center rounded-lg border border-dashed border-[#94a3b8] bg-[#f8fafc]">
                  <p className="text-sm font-medium text-[#64748b]">
                    시나리오를 선택하세요.
                  </p>
                </div>
              ) : activeScenario === "E1" || activeScenario === 1 ? (
                <E1View rows={filteredRows} />
              ) : activeScenario === "E3" || activeScenario === 3 ? (
                <E3View rows={filteredRows} />
              ) : (
                <EstimateLineChart
                  data={filteredRows}
                  title="KF Estimate vs Ground Truth"
                />
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
