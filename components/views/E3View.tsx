"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  Line,
  LineChart,
  Legend,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useE1Store, E1_ALGORITHM_COLORS, E1_ALGORITHM_LABELS, type E1AlgorithmId } from "@/lib/e1-store";
import { ALL_RUNS, RUN_LABELS, type RunId } from "@/lib/e1-csv-parser";
import { applyTrim, getGroundTruth } from "@/lib/e1-metrics";
import { calculateRMSE, calculateMAE, calculateNISPassRate } from "@/lib/metrics";
import { PAPER_RESULTS } from "@/lib/paper-results";
import type { E1Row } from "@/lib/e1-csv-parser";
import RunSelector from "@/components/e1/RunSelector";
import AlgorithmToggle from "@/components/e1/AlgorithmToggle";
import TrimControl from "@/components/e1/TrimControl";

interface BlockedInterval {
  x1: number;
  x2: number;
}

/**
 * algoId별 estimate 컬럼 반환.
 */
function getEstimate(row: E1Row, algoId: E1AlgorithmId): number | undefined {
  switch (algoId) {
    case "raw":    return row.tof_distance_mm;
    case "fixed":  return row.fixed_estimate_mm;
    case "cm":     return row.cm_estimate_mm;
    case "tinyml": return row.tinyml_estimate_mm;
  }
}

/**
 * ToF 차단 구간 탐지.
 * range_status 컬럼이 있으면 range_status !== 0 기준 우선.
 * null인 경우 경험적 30% 오차 임계값으로 폴백.
 * gt_distance_mm < 1 인 행은 near-zero 오인 방지를 위해 비차단으로 처리.
 */
function detectBlockedIntervals(
  rows: E1Row[],
): { intervals: BlockedInterval[]; method: "range_status" | "threshold" } {
  const hasRangeStatus = rows.some((r) => r.tof_range_status !== null);
  const intervals: BlockedInterval[] = [];
  let inBlocked = false;
  let blockStart = 0;

  for (const row of rows) {
    let isBlocked: boolean;
    if (hasRangeStatus) {
      isBlocked = row.tof_range_status !== null && row.tof_range_status !== 0;
    } else {
      isBlocked =
        row.gt_distance_mm >= 1 &&
        Math.abs(row.tof_distance_mm - row.gt_distance_mm) / row.gt_distance_mm > 0.3;
    }

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

  return { intervals, method: hasRangeStatus ? "range_status" : "threshold" };
}

function safeNISPassRate(nu: number[], S: number[]): number | undefined {
  const paired = nu.map((v, i) => ({ v, s: S[i] })).filter((p) => p.s > 0);
  if (paired.length === 0) return undefined;
  try {
    return calculateNISPassRate(
      paired.map((p) => p.v),
      paired.map((p) => p.s),
    );
  } catch {
    return undefined;
  }
}

/** TinyML NIS는 항상 "—". innovation_cov 컬럼이 없음. */
function renderNIS(algoId: E1AlgorithmId, nisValue: number | undefined): string {
  if (algoId === "tinyml") return "—";
  return nisValue != null ? `${(nisValue * 100).toFixed(1)}%` : "—";
}

interface ChartPoint {
  timestamp_ms: number;
  gt: number;
  raw?: number;
  fixed?: number;
  cm?: number;
  tinyml?: number;
}

interface RChartPoint {
  timestamp_ms: number;
  cm_R: number;
  tinyml_R?: number;
}

export default function E3View() {
  const { runs, activeRun, selectedAlgorithms, hasTinyML, autoExcludeStop, trimTail } =
    useE1Store();

  // R̂ 회복 시계열 데이터 (cm_R vs tinyml_R)
  const { rChartData, rXTicks, rYMax } = useMemo(() => {
    const runId: RunId | undefined =
      activeRun === "all"
        ? ALL_RUNS.find((r) => runs[r] !== undefined)
        : (activeRun as RunId);
    const runData = runId ? runs[runId] : undefined;
    if (!runData || runData.rows.length === 0) {
      return { rChartData: [], rXTicks: undefined, rYMax: 500 };
    }

    const trimmed = applyTrim(runData.rows, autoExcludeStop, trimTail);
    const hasTinymlR = hasTinyML && trimmed.every((r) => r.tinyml_R !== undefined);
    const points: RChartPoint[] = trimmed.map((r) => ({
      timestamp_ms: r.timestamp_ms,
      cm_R: Math.min(r.cm_R, 10000), // 폭발 방지 클램프
      tinyml_R: hasTinymlR && r.tinyml_R !== undefined
        ? Math.min(r.tinyml_R, 10000)
        : undefined,
    }));

    const allR = points.flatMap((p) =>
      [p.cm_R, p.tinyml_R].filter((v): v is number => v !== undefined),
    );
    const maxR = allR.length > 0 ? Math.max(...allR) : 500;

    let ticks: number[] | undefined;
    if (points.length > 10) {
      const step = Math.floor(points.length / 8);
      ticks = [];
      for (let i = 0; i < points.length; i += step) ticks.push(points[i].timestamp_ms);
      const last = points[points.length - 1].timestamp_ms;
      if (ticks[ticks.length - 1] !== last) ticks.push(last);
    }

    return { rChartData: points, rXTicks: ticks, rYMax: Math.ceil(maxR * 1.1) };
  }, [runs, activeRun, hasTinyML, autoExcludeStop, trimTail]);

  const { metricRows, blockedIntervals, detectionMethod, chartData, xTicks, activeAlgos } =
    useMemo(() => {
      const runId: RunId | undefined =
        activeRun === "all"
          ? ALL_RUNS.find((r) => runs[r] !== undefined)
          : (activeRun as RunId);
      const runData = runId ? runs[runId] : undefined;

      if (!runData || runData.rows.length === 0) {
        return {
          metricRows: [],
          blockedIntervals: [],
          detectionMethod: "threshold" as const,
          chartData: [],
          xTicks: undefined,
          activeAlgos: [] as E1AlgorithmId[],
        };
      }

      const trimmed = applyTrim(runData.rows, autoExcludeStop, trimTail);
      if (trimmed.length === 0) {
        return {
          metricRows: [],
          blockedIntervals: [],
          detectionMethod: "threshold" as const,
          chartData: [],
          xTicks: undefined,
          activeAlgos: [] as E1AlgorithmId[],
        };
      }

      const gt = getGroundTruth(trimmed);
      const { intervals, method } = detectBlockedIntervals(trimmed);

      // 알고리즘별 메트릭
      const algos: E1AlgorithmId[] = ["raw", "fixed", "cm"];
      const hasTinymlEstimate = hasTinyML && trimmed.every((r) => r.tinyml_estimate_mm !== undefined);
      if (hasTinymlEstimate) algos.push("tinyml");

      const visibleAlgos = algos.filter((id) => selectedAlgorithms.includes(id));

      const rows = visibleAlgos.map((algoId) => {
        const estimates = trimmed.map((r) => getEstimate(r, algoId));
        const numericEstimates = estimates.every((v): v is number => typeof v === "number")
          ? estimates
          : null;
        let rmse: number | null = null;
        let mae: number | null = null;
        let nisPassRate: number | undefined = undefined;

        if (numericEstimates) {
          try { rmse = calculateRMSE(numericEstimates, gt); } catch { /* skip */ }
          try { mae = calculateMAE(numericEstimates, gt); } catch { /* skip */ }
        }

        // NIS: fixed, cm만 계산
        if (algoId === "fixed") {
          nisPassRate = safeNISPassRate(
            trimmed.map((r) => r.fixed_residual),
            trimmed.map((r) => r.fixed_innovation_cov),
          );
        } else if (algoId === "cm") {
          nisPassRate = safeNISPassRate(
            trimmed.map((r) => r.cm_residual),
            trimmed.map((r) => r.cm_innovation_cov),
          );
        }

        const maxError =
          numericEstimates && numericEstimates.length > 0
            ? Math.max(...numericEstimates.map((e, i) => Math.abs(e - gt[i])))
            : null;

        return { algoId, rmse, mae, maxError, nisPassRate };
      });

      // 차트 데이터
      const points: ChartPoint[] = trimmed.map((r, i) => {
        const point: ChartPoint = { timestamp_ms: r.timestamp_ms, gt: gt[i] };
        for (const algoId of visibleAlgos) {
          const val = getEstimate(r, algoId);
          if (val !== undefined) point[algoId] = val;
        }
        return point;
      });

      let ticks: number[] | undefined;
      if (points.length > 10) {
        const step = Math.floor(points.length / 8);
        ticks = [];
        for (let i = 0; i < points.length; i += step) ticks.push(points[i].timestamp_ms);
        const last = points[points.length - 1].timestamp_ms;
        if (ticks[ticks.length - 1] !== last) ticks.push(last);
      }

      return {
        metricRows: rows,
        blockedIntervals: intervals,
        detectionMethod: method,
        chartData: points,
        xTicks: ticks,
        activeAlgos: visibleAlgos,
      };
    }, [runs, activeRun, selectedAlgorithms, hasTinyML, autoExcludeStop, trimTail]);

  // 데이터 없으면 업로드 안내
  const hasAnyRun = Object.values(runs).some((r) => r !== undefined);
  const hasTinyMLRChart = rChartData.some((p) => p.tinyml_R !== undefined);
  const displayedRunId = activeRun === "all"
    ? ALL_RUNS.find((r) => runs[r] !== undefined)
    : (activeRun as RunId);
  if (!hasAnyRun) {
    return (
      <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-6 shadow-sm">
        <p className="text-base font-semibold text-[#92400e]">업로드된 CSV가 없습니다.</p>
        <p className="mt-2 text-sm text-[#78350f]">
          E3 런별 CSV를 업로드한 후 이 화면을 확인하세요.
          파일명 형식:{" "}
          <code className="rounded bg-[#fef3c7] px-1">E3_run01.csv</code> ~{" "}
          <code className="rounded bg-[#fef3c7] px-1">E3_run05.csv</code>
        </p>
        <Link
          href="/upload"
          className="mt-4 inline-block rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
        >
          CSV 업로드하러 가기
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
              업로드 CSV 계산값
            </p>
            <span className="rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1 text-xs font-semibold text-[#15803d]">
              동적 분석
            </span>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
              런 선택
            </p>
            <RunSelector />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
              알고리즘
            </p>
            <AlgorithmToggle />
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
              트림 설정
            </p>
            <TrimControl />
          </div>
        </div>
      </div>

      {/* 메트릭 테이블 */}
      <div className="overflow-x-auto rounded-lg border border-[#d9e0ea] bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-[#f8fafc]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-[#475569]">알고리즘</th>
              <th className="px-4 py-3 text-right font-semibold text-[#475569]">RMSE</th>
              <th className="px-4 py-3 text-right font-semibold text-[#475569]">MAE</th>
              <th className="px-4 py-3 text-right font-semibold text-[#475569]">Max Error</th>
              <th className="px-4 py-3 text-right font-semibold text-[#475569]">NIS 95%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {metricRows.map(({ algoId, rmse, mae, maxError, nisPassRate }) => (
              <tr key={algoId}>
                <td className="px-4 py-3 font-medium text-[#111827]">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: E1_ALGORITHM_COLORS[algoId] }}
                    />
                    {E1_ALGORITHM_LABELS[algoId]}
                  </span>
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
                <td className="px-4 py-3 text-right text-[#111827]">
                  {renderNIS(algoId, nisPassRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 차단 구간 안내 */}
      {blockedIntervals.length > 0 ? (
        <p className="text-xs text-[#64748b]">
          차단 구간 {blockedIntervals.length}개 탐지
          <span className="ml-2 inline-block h-2 w-4 rounded-sm bg-[#fee2e2]" />
          <span className="ml-1">
            {detectionMethod === "range_status"
              ? "range_status 비정상 구간"
              : "경험적 탐지 (gt 대비 30% 이상 오차)"}
          </span>
        </p>
      ) : (
        <p className="text-xs text-[#94a3b8]">
          차단 구간을 탐지하지 못했습니다.
          {detectionMethod === "threshold" && " (gt 대비 30% 이상 오차 기준)"}
        </p>
      )}

      {/* 위치 시계열 차트 */}
      {chartData.length > 0 && (
        <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#64748b]">
            차트 — E3 위치 추정 (GT · Raw · Fixed · CM
            {activeAlgos.includes("tinyml") ? " · TinyML" : ""})
            {activeRun === "all" && (
              <span className="ml-1.5 font-normal text-[#94a3b8]">
                (All: 메트릭은 평균, 차트는 {displayedRunId ? RUN_LABELS[displayedRunId] : "첫 run"} 표시)
              </span>
            )}
          </p>
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
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
                  formatter={(v) => [typeof v === "number" ? `${v.toFixed(2)} mm` : v]}
                  labelFormatter={(l) => `t = ${l} ms`}
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
                  dataKey="gt"
                  name="GT (CSV)"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  dot={false}
                  connectNulls={false}
                />
                {activeAlgos.map((algoId) => (
                  <Line
                    key={algoId}
                    type="monotone"
                    dataKey={algoId}
                    name={E1_ALGORITHM_LABELS[algoId]}
                    stroke={E1_ALGORITHM_COLORS[algoId]}
                    strokeWidth={1.5}
                    dot={false}
                    connectNulls={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* R̂ 회복 시계열 (그림 5-1 대응) */}
      {rChartData.length > 0 && hasTinyMLRChart ? (
        <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#64748b]">
            차트 — R̂ 회복 시계열 (CM-AKF vs TinyML-AKF)
            {activeRun === "all" && (
              <span className="ml-1.5 font-normal text-[#94a3b8]">
                (All: {displayedRunId ? RUN_LABELS[displayedRunId] : "첫 run"} 표시)
              </span>
            )}
          </p>
          <p className="mt-1 text-xs text-[#94a3b8]">
            차단 이탈 후 적응 노이즈 공분산 R̂ 회복 속도 비교. 클램프 10,000 mm².
          </p>
          <div className="mt-3">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={rChartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                <XAxis
                  dataKey="timestamp_ms"
                  ticks={rXTicks}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => String(v)}
                  label={{ value: "timestamp (ms)", position: "insideBottom", offset: -2, fontSize: 11 }}
                  height={40}
                />
                <YAxis
                  domain={[0, rYMax]}
                  tick={{ fontSize: 11 }}
                  label={{ value: "R̂ (mm²)", angle: -90, position: "insideLeft", offset: 10, fontSize: 11 }}
                />
                <Tooltip
                  formatter={(v) => [typeof v === "number" ? `${v.toFixed(2)} mm²` : v]}
                  labelFormatter={(l) => `t = ${l} ms`}
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
                  dataKey="cm_R"
                  name="CM-AKF R̂"
                  stroke={E1_ALGORITHM_COLORS.cm}
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls={false}
                />
                <Line
                  type="monotone"
                  dataKey="tinyml_R"
                  name="TinyML-AKF R̂"
                  stroke={E1_ALGORITHM_COLORS.tinyml}
                  strokeWidth={1.5}
                  dot={false}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        /* 25컬럼 CSV 또는 데이터 없을 때: 논문 확정 수치 fallback 카드 */
        <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#64748b]">
            R̂ 회복 시간 — 논문 확정 수치 (그림 5-1 기준)
          </p>
          <p className="mt-1 text-xs text-[#94a3b8]">
            28컬럼 TinyML CSV 업로드 시 동적 차트로 전환됩니다.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-md bg-[#f0fdf4] p-4">
              <p className="text-xs font-semibold text-[#15803d]">TinyML-AKF</p>
              <p className="mt-1 text-2xl font-bold text-[#16a34a]">
                {PAPER_RESULTS.E3.recoveryTimeTinyML_ms} ms
              </p>
              <p className="mt-0.5 text-xs text-[#4ade80]">
                3 frames @ 50Hz
              </p>
            </div>
            <div className="rounded-md bg-[#eff6ff] p-4">
              <p className="text-xs font-semibold text-[#1d4ed8]">CM-AKF</p>
              <p className="mt-1 text-2xl font-bold text-[#2563eb]">
                {PAPER_RESULTS.E3.recoveryTimeCM_ms} ms
              </p>
              <p className="mt-0.5 text-xs text-[#93c5fd]">
                8 frames @ 50Hz
              </p>
            </div>
          </div>
          <div className="mt-3 rounded-md bg-[#fefce8] px-4 py-2">
            <p className="text-sm font-semibold text-[#854d0e]">
              → TinyML {PAPER_RESULTS.E3.recoverySpeedup}× 빠른 회복
            </p>
            <p className="mt-0.5 text-xs text-[#92400e]">
              CM-AKF는 R̂ 재학습(160ms), TinyML은 추론 즉시 반응(60ms)
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
