"use client";

import { useMemo } from "react";
import { useE1Store, E1_ALGORITHM_COLORS } from "@/lib/e1-store";
import { PAPER_RESULTS } from "@/lib/paper-results";
import type { AlgoMetrics } from "@/lib/paper-results";

function fmt(v: number, digits = 2): string {
  return v.toFixed(digits);
}

function pct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

interface MetricRowProps {
  label: string;
  color: string;
  value: string;
}

function MetricRow({ label, color, value }: MetricRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="flex items-center gap-1.5 text-sm font-semibold text-[#374151]">
        <span
          className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        {label}
      </span>
      <span className="shrink-0 text-sm font-black text-[#111827]">{value}</span>
    </div>
  );
}

interface CardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function Card({ title, subtitle, children }: CardProps) {
  return (
    <div className="rounded-lg border border-[#d1d5db] bg-white p-4 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.08em] text-[#111827]">
        {title}
      </p>
      {subtitle && <p className="mt-0.5 text-xs font-medium text-[#6b7280]">{subtitle}</p>}
      <div className="mt-2 divide-y divide-[#f1f5f9]">{children}</div>
    </div>
  );
}

interface AlgoEntry {
  id: "raw" | "fixed" | "cm" | "tinyml";
  label: string;
  metrics: AlgoMetrics;
}

/** 활성 시나리오 + E2 표면에 따라 PAPER_RESULTS에서 알고리즘별 메트릭 추출 */
function useScenarioAlgoMetrics(): { raw: AlgoMetrics; fixed: AlgoMetrics; cm: AlgoMetrics; tinyml: AlgoMetrics } {
  const { activeScenario, activeE2Surface } = useE1Store();

  return useMemo(() => {
    if (activeScenario === "E2") {
      const surface = activeE2Surface ?? "white";
      const s = PAPER_RESULTS.E2.surfaces[surface];
      return { raw: s.raw, fixed: s.fixed, cm: s.cm, tinyml: s.tinyml };
    }
    const data = PAPER_RESULTS[activeScenario as "E1" | "E3" | "E4" | "E5"];
    return { raw: data.raw, fixed: data.fixed, cm: data.cm, tinyml: data.tinyml };
  }, [activeScenario, activeE2Surface]);
}

export default function E1MetricCards() {
  const { selectedAlgorithms } = useE1Store();
  const scenarioMetrics = useScenarioAlgoMetrics();

  const allAlgos: AlgoEntry[] = [
    { id: "raw",    label: "Raw ToF",    metrics: scenarioMetrics.raw },
    { id: "fixed",  label: "Fixed KF",   metrics: scenarioMetrics.fixed },
    { id: "cm",     label: "CM-AKF",     metrics: scenarioMetrics.cm },
    { id: "tinyml", label: "TinyML-AKF", metrics: scenarioMetrics.tinyml },
  ];

  const visibleAlgos = allAlgos.filter(({ id }) => selectedAlgorithms.includes(id));
  // RMSEss / Tconv: Fixed KF + CM-AKF + TinyML-AKF만 표시 (Raw ToF 제외)
  const kfAlgos = visibleAlgos.filter(({ id }) => id !== "raw");

  return (
    <div className="space-y-3">
      {/* 논문 확정값 배지 */}
      <div className="flex justify-start">
        <span className="rounded-full border border-[#111827] bg-[#111827] px-4 py-1.5 text-base font-black text-white">
          논문 확정값
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {/* RMSE */}
        <Card title="RMSE" subtitle="mm">
          {visibleAlgos.map(({ id, label, metrics }) => (
            <MetricRow
              key={id}
              label={label}
              color={E1_ALGORITHM_COLORS[id]}
              value={`${fmt(metrics.rmse)} mm`}
            />
          ))}
        </Card>

        {/* MAE */}
        <Card title="MAE" subtitle="mm">
          {visibleAlgos.map(({ id, label, metrics }) => (
            <MetricRow
              key={id}
              label={label}
              color={E1_ALGORITHM_COLORS[id]}
              value={`${fmt(metrics.mae)} mm`}
            />
          ))}
        </Card>

        {/* NIS 95% pass rate */}
        <Card title="NIS 95% Pass Rate" subtitle="chi-sq df=1 기준">
          {visibleAlgos
            .filter(({ id }) => id !== "raw")
            .map(({ id, label, metrics }) => (
              <MetricRow
                key={id}
                label={label}
                color={E1_ALGORITHM_COLORS[id]}
                value={
                  id === "tinyml"
                    ? "—"
                    : metrics.nis != null
                      ? pct(metrics.nis)
                      : "—"
                }
              />
            ))}
          {visibleAlgos.every(({ id }) => id === "raw") && (
            <p className="py-1 text-sm text-[#94a3b8]">N/A (Raw only)</p>
          )}
        </Card>

        {/* RMSEss (후반 1초 RMSE) */}
        <Card title="RMSEss" subtitle="후반 50 frame (1초 @ 50Hz)">
          {kfAlgos.map(({ id, label, metrics }) => (
            <MetricRow
              key={id}
              label={label}
              color={E1_ALGORITHM_COLORS[id]}
              value={
                metrics.rmseSS != null
                  ? `${fmt(metrics.rmseSS)} mm`
                  : "—"
              }
            />
          ))}
          {kfAlgos.length === 0 && (
            <p className="py-1 text-sm text-[#94a3b8]">Fixed/CM 선택 후 표시</p>
          )}
        </Card>

        {/* Tconv (수렴 시간) */}
        <Card title="Tconv" subtitle="슬라이딩 50 frame RMSE ≤ 1.1 × RMSEss">
          {kfAlgos.map(({ id, label, metrics }) => {
            const tconv = metrics.tconv;
            const display =
              tconv == null ? "—" :
              tconv < 1000 ? `${tconv.toFixed(0)} ms` :
              `${(tconv / 1000).toFixed(2)} s`;
            return (
              <MetricRow
                key={id}
                label={label}
                color={E1_ALGORITHM_COLORS[id]}
                value={display}
              />
            );
          })}
          {kfAlgos.length === 0 && (
            <p className="py-1 text-sm text-[#94a3b8]">Fixed/CM 선택 후 표시</p>
          )}
        </Card>
      </div>
    </div>
  );
}
