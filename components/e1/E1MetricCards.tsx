"use client";

import { useMemo } from "react";
import { useE1Store, E1_ALGORITHM_COLORS, type E1AlgorithmId } from "@/lib/e1-store";
import { ALL_RUNS, RUN_LABELS, type RunId } from "@/lib/e1-csv-parser";
import {
  calculateE1Metrics,
  averageE1Metrics,
  type E1RunMetrics,
} from "@/lib/e1-metrics";
import { exportMetricsCSV } from "@/lib/export";

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
    <div className="flex items-center justify-between py-1">
      <span className="flex items-center gap-1.5 text-sm text-[#475569]">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: color }}
        />
        {label}
      </span>
      <span className="text-sm font-semibold text-[#111827]">{value}</span>
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
    <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
        {title}
      </p>
      {subtitle && <p className="mt-0.5 text-xs text-[#94a3b8]">{subtitle}</p>}
      <div className="mt-3 divide-y divide-[#f1f5f9]">{children}</div>
    </div>
  );
}

type RequiredAlgoId = "raw" | "fixed" | "cm";
const ALGO_IDS: RequiredAlgoId[] = ["raw", "fixed", "cm"];

/** TinyML NIS는 항상 "—". innovation_cov 컬럼이 없음. */
function renderNISValue(id: string, nisPassRate: number | undefined): string {
  if (id === "tinyml") return "—";
  if (nisPassRate != null) return pct(nisPassRate);
  return "—";
}

export default function E1MetricCards() {
  const { runs, activeRun, selectedAlgorithms, autoExcludeStop, trimTail, hasTinyML } =
    useE1Store();

  // 현재 표시 중인 메트릭을 계산
  const allRunMetrics = useMemo<Array<{ runLabel: string; metrics: E1RunMetrics }>>(() => {
    if (activeRun === "all") {
      return ALL_RUNS.flatMap((r) => {
        const d = runs[r];
        if (!d) return [];
        const m = calculateE1Metrics(d.rows, autoExcludeStop, trimTail);
        return m ? [{ runLabel: RUN_LABELS[r], metrics: m }] : [];
      });
    }
    const d = runs[activeRun as RunId];
    if (!d) return [];
    const m = calculateE1Metrics(d.rows, autoExcludeStop, trimTail);
    return m ? [{ runLabel: RUN_LABELS[activeRun as RunId], metrics: m }] : [];
  }, [runs, activeRun, autoExcludeStop, trimTail]);

  const metrics: E1RunMetrics | null = useMemo(() => {
    if (activeRun === "all") {
      return averageE1Metrics(allRunMetrics.map((r) => r.metrics));
    }
    return allRunMetrics[0]?.metrics ?? null;
  }, [activeRun, allRunMetrics]);

  function handleExport() {
    if (allRunMetrics.length === 0) return;
    // activeRun = "all"이면 전체 런 개별 export, 아니면 현재 런만
    exportMetricsCSV(
      allRunMetrics,
      `kalman_metrics_${activeRun}.csv`,
    );
  }

  if (!metrics) {
    return (
      <p className="text-sm text-[#94a3b8]">
        선택된 런의 데이터가 없습니다.
      </p>
    );
  }

  const visibleAlgos = ALGO_IDS.filter((id) => selectedAlgorithms.includes(id as E1AlgorithmId));
  // TinyML이 있고 토글 선택된 경우 추가
  const showTinyML = hasTinyML && selectedAlgorithms.includes("tinyml") && metrics.tinyml != null;

  // RMSEss / Tconv: raw는 KF 아님 → 제외, fixed/cm/tinyml만 표시
  const kfAlgos = (["fixed", "cm"] as const).filter((id) =>
    selectedAlgorithms.includes(id as E1AlgorithmId),
  );

  return (
    <div className="space-y-3">
      {/* 내보내기 버튼 */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-1.5 rounded-md border border-[#d1d5db] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] shadow-sm hover:bg-[#f9fafb] hover:border-[#9ca3af]"
        >
          <span>⬇</span>
          <span>결과 CSV 내보내기</span>
        </button>
      </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {/* RMSE */}
      <Card title="RMSE" subtitle="mm">
        {visibleAlgos.map((id) => (
          <MetricRow
            key={id}
            label={id === "raw" ? "Raw ToF" : id === "fixed" ? "Fixed KF" : "CM-AKF"}
            color={E1_ALGORITHM_COLORS[id]}
            value={`${fmt(metrics[id].rmse)} mm`}
          />
        ))}
        {showTinyML && (
          <MetricRow
            label="TinyML-AKF"
            color={E1_ALGORITHM_COLORS.tinyml}
            value={`${fmt(metrics.tinyml!.rmse)} mm`}
          />
        )}
      </Card>

      {/* MAE */}
      <Card title="MAE" subtitle="mm">
        {visibleAlgos.map((id) => (
          <MetricRow
            key={id}
            label={id === "raw" ? "Raw ToF" : id === "fixed" ? "Fixed KF" : "CM-AKF"}
            color={E1_ALGORITHM_COLORS[id]}
            value={`${fmt(metrics[id].mae)} mm`}
          />
        ))}
        {showTinyML && (
          <MetricRow
            label="TinyML-AKF"
            color={E1_ALGORITHM_COLORS.tinyml}
            value={`${fmt(metrics.tinyml!.mae)} mm`}
          />
        )}
      </Card>

      {/* NIS 95% pass rate */}
      <Card title="NIS 95% Pass Rate" subtitle="chi-sq df=1 기준">
        {visibleAlgos
          .filter((id) => metrics[id].nisPassRate !== undefined)
          .map((id) => (
            <MetricRow
              key={id}
              label={id === "fixed" ? "Fixed KF" : "CM-AKF"}
              color={E1_ALGORITHM_COLORS[id]}
              value={renderNISValue(id, metrics[id].nisPassRate)}
            />
          ))}
        {/* TinyML NIS는 항상 "—" */}
        {showTinyML && (
          <MetricRow
            label="TinyML-AKF"
            color={E1_ALGORITHM_COLORS.tinyml}
            value="—"
          />
        )}
        {visibleAlgos.every((id) => metrics[id].nisPassRate === undefined) && !showTinyML && (
          <p className="py-1 text-sm text-[#94a3b8]">N/A (Raw only)</p>
        )}
      </Card>

      {/* RMSEss (후반 1초 RMSE) */}
      <Card title="RMSEss" subtitle="후반 50 frame (1초 @ 50Hz)">
        {kfAlgos.map((id) => (
          <MetricRow
            key={id}
            label={id === "fixed" ? "Fixed KF" : "CM-AKF"}
            color={E1_ALGORITHM_COLORS[id]}
            value={
              metrics[id].rmseSS != null
                ? `${fmt(metrics[id].rmseSS!)} mm`
                : "—"
            }
          />
        ))}
        {showTinyML && metrics.tinyml?.rmseSS != null && (
          <MetricRow
            label="TinyML-AKF"
            color={E1_ALGORITHM_COLORS.tinyml}
            value={`${fmt(metrics.tinyml!.rmseSS!)} mm`}
          />
        )}
        {kfAlgos.length === 0 && !showTinyML && (
          <p className="py-1 text-sm text-[#94a3b8]">Fixed/CM 선택 후 표시</p>
        )}
      </Card>

      {/* Tconv (수렴 시간) */}
      <Card title="Tconv" subtitle="슬라이딩 50 frame RMSE ≤ 1.1 × RMSEss">
        {kfAlgos.map((id) => {
          const tconv = metrics[id].tconv;
          const display =
            tconv == null ? "—" :
            tconv < 1000 ? `${tconv.toFixed(0)} ms` :
            `${(tconv / 1000).toFixed(2)} s`;
          return (
            <MetricRow
              key={id}
              label={id === "fixed" ? "Fixed KF" : "CM-AKF"}
              color={E1_ALGORITHM_COLORS[id]}
              value={display}
            />
          );
        })}
        {showTinyML && (
          <MetricRow
            label="TinyML-AKF"
            color={E1_ALGORITHM_COLORS.tinyml}
            value={(() => {
              const tconv = metrics.tinyml?.tconv;
              if (tconv == null) return "—";
              return tconv < 1000 ? `${tconv.toFixed(0)} ms` : `${(tconv / 1000).toFixed(2)} s`;
            })()}
          />
        )}
        {kfAlgos.length === 0 && !showTinyML && (
          <p className="py-1 text-sm text-[#94a3b8]">Fixed/CM 선택 후 표시</p>
        )}
      </Card>

      {/* CM-R */}
      <Card title="CM-R (적응 노이즈)" subtitle="cm_R 통계">
        <MetricRow
          label="평균"
          color={E1_ALGORITHM_COLORS.cm}
          value={fmt(metrics.cmRMean)}
        />
        <MetricRow
          label="최솟값"
          color="#94a3b8"
          value={fmt(metrics.cmRMin)}
        />
        <MetricRow
          label="최댓값"
          color="#94a3b8"
          value={fmt(metrics.cmRMax)}
        />
      </Card>
    </div>
    </div>
  );
}
