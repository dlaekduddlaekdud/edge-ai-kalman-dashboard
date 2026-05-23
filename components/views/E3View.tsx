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
 *
 * 우선순위:
 *   1. range_status !== 0 인 행이 존재하면 그 기준 사용
 *   2. 없으면 reconstructed GT 기준: (gt[i] - tof[i]) > BLOCKED_THRESHOLD mm
 *      → 차단재가 센서와 로봇 사이에 있을 때 tof가 실제 위치보다 짧게 읽히는 원리
 *
 * gt_distance_mm가 전부 0인 CSV에서도 getGroundTruth(rows)를 통해
 * 스케일 보정 encoder 역산 GT를 활용하므로 정상 탐지된다.
 */
const BLOCKED_THRESHOLD_MM = 40;

function detectBlockedIntervals(
  rows: E1Row[],
  gt: number[],
): { intervals: BlockedInterval[]; method: "range_status" | "threshold" } {
  // range_status가 실제로 비정상인 행이 있으면 해당 컬럼 기준
  const hasRangeStatus = rows.some(
    (r) => r.tof_range_status !== null && r.tof_range_status !== 0,
  );
  const intervals: BlockedInterval[] = [];
  let inBlocked = false;
  let blockStart = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    let isBlocked: boolean;

    if (hasRangeStatus) {
      isBlocked = row.tof_range_status !== null && row.tof_range_status !== 0;
    } else {
      // GT보다 tof가 BLOCKED_THRESHOLD 이상 짧게 읽히면 차단 구간으로 판정.
      // gt가 충분히 큰 구간(> 100mm)에서만 적용해 종단 노이즈 오탐을 방지.
      const gtVal = gt[i] ?? 0;
      isBlocked = gtVal > 100 && (gtVal - row.tof_distance_mm) > BLOCKED_THRESHOLD_MM;
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
    // spread 대신 reduce — 대규모 R 배열(E4 등) 스택 오버플로우 방지
    const maxR = allR.length > 0 ? allR.reduce((m, v) => Math.max(m, v), -Infinity) : 500;

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

  const { blockedIntervals, detectionMethod, chartData, xTicks, activeAlgos, showGT } =
    useMemo(() => {
      const runId: RunId | undefined =
        activeRun === "all"
          ? ALL_RUNS.find((r) => runs[r] !== undefined)
          : (activeRun as RunId);
      const runData = runId ? runs[runId] : undefined;

      if (!runData || runData.rows.length === 0) {
        return {
          blockedIntervals: [],
          detectionMethod: "threshold" as const,
          chartData: [],
          xTicks: undefined,
          activeAlgos: [] as E1AlgorithmId[],
          showGT: false,
        };
      }

      const trimmed = applyTrim(runData.rows, autoExcludeStop, trimTail);
      if (trimmed.length === 0) {
        return {
          blockedIntervals: [],
          detectionMethod: "threshold" as const,
          chartData: [],
          xTicks: undefined,
          activeAlgos: [] as E1AlgorithmId[],
          showGT: false,
        };
      }

      const gt = getGroundTruth(trimmed);
      // 데모 CSV는 gt=0 → GT 라인 숨김
      const showGT = gt.some((v) => v !== 0);
      const { intervals, method } = detectBlockedIntervals(trimmed, gt);

      const algos: E1AlgorithmId[] = ["raw", "fixed", "cm"];
      const hasTinymlEstimate = hasTinyML && trimmed.every((r) => r.tinyml_estimate_mm !== undefined);
      if (hasTinymlEstimate) algos.push("tinyml");

      const visibleAlgos = algos.filter((id) => selectedAlgorithms.includes(id));

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
        blockedIntervals: intervals,
        detectionMethod: method,
        chartData: points,
        xTicks: ticks,
        activeAlgos: visibleAlgos,
        showGT,
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
          Data 탭에서 E3 시나리오를 선택하고 데이터를 불러오세요.
          파일명 형식:{" "}
          <code className="rounded bg-[#fef3c7] px-1">E3_run01.csv</code> ~{" "}
          <code className="rounded bg-[#fef3c7] px-1">E3_run05.csv</code>
        </p>
        <Link
          href="/upload"
          className="mt-4 inline-block rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
        >
          Data 탭으로 이동
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

      {/* 메트릭 테이블 — 논문 확정값 */}
      <div className="overflow-x-auto rounded-lg border border-[#d9e0ea] bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-2.5">
          <p className="text-xs font-semibold text-[#475569]">알고리즘별 성능 (E3 — ToF 차단 구간)</p>
          <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-0.5 text-[11px] font-semibold text-[#1d4ed8]">
            논문 확정값
          </span>
        </div>
        <table className="min-w-full text-sm">
          <thead className="bg-[#f8fafc]">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-[#475569]">알고리즘</th>
              <th className="px-4 py-3 text-right font-semibold text-[#475569]">RMSE</th>
              <th className="px-4 py-3 text-right font-semibold text-[#475569]">MAE</th>
              <th className="px-4 py-3 text-right font-semibold text-[#475569]">NIS 95%</th>
              <th className="px-4 py-3 text-right font-semibold text-[#475569]">RMSEss</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e2e8f0]">
            {(
              [
                { id: "raw",    label: "Raw ToF",    m: PAPER_RESULTS.E3.raw },
                { id: "fixed",  label: "Fixed KF",   m: PAPER_RESULTS.E3.fixed },
                { id: "cm",     label: "CM-AKF",     m: PAPER_RESULTS.E3.cm },
                { id: "tinyml", label: "TinyML-AKF", m: PAPER_RESULTS.E3.tinyml },
              ] as const
            )
              .filter(({ id }) => selectedAlgorithms.includes(id as E1AlgorithmId))
              .map(({ id, label, m }) => (
                <tr key={id}>
                  <td className="px-4 py-3 font-medium text-[#111827]">
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: E1_ALGORITHM_COLORS[id as E1AlgorithmId] }}
                      />
                      {label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[#111827]">{m.rmse.toFixed(2)} mm</td>
                  <td className="px-4 py-3 text-right text-[#111827]">{m.mae.toFixed(2)} mm</td>
                  <td className="px-4 py-3 text-right text-[#111827]">
                    {id === "tinyml" || id === "raw"
                      ? "—"
                      : m.nis != null
                        ? `${(m.nis * 100).toFixed(1)}%`
                        : "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-[#111827]">
                    {m.rmseSS != null ? `${m.rmseSS.toFixed(2)} mm` : "—"}
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
              : `ToF ${BLOCKED_THRESHOLD_MM}mm 이상 급감 구간`}
          </span>
        </p>
      ) : (
        <p className="text-xs text-[#94a3b8]">
          차단 구간을 탐지하지 못했습니다.
          {detectionMethod === "threshold" &&
            ` (ToF ${BLOCKED_THRESHOLD_MM}mm 이상 급감 구간 기준)`}
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
                  tick={{ fontSize: 13 }}
                  tickFormatter={(v: number) => String(v)}
                  label={{ value: "timestamp (ms)", position: "insideBottom", offset: -2, fontSize: 13 }}
                  height={40}
                />
                <YAxis
                  tick={{ fontSize: 13 }}
                  label={{ value: "distance (mm)", angle: -90, position: "insideLeft", offset: 10, fontSize: 13 }}
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
                  tick={{ fontSize: 13 }}
                  tickFormatter={(v: number) => String(v)}
                  label={{ value: "timestamp (ms)", position: "insideBottom", offset: -2, fontSize: 13 }}
                  height={40}
                />
                <YAxis
                  domain={[0, rYMax]}
                  tick={{ fontSize: 13 }}
                  label={{ value: "R̂ (mm²)", angle: -90, position: "insideLeft", offset: 10, fontSize: 13 }}
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
