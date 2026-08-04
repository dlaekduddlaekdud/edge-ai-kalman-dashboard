import type { E1Row } from "@/lib/e1-csv-parser";
import type { E1AlgorithmId } from "@/lib/e1-store";

export interface BlockedInterval {
  x1: number;
  x2: number;
}

export interface ChartPoint {
  timestamp_ms: number;
  gt: number;
  raw?: number;
  fixed?: number;
  cm?: number;
  tinyml?: number;
}

export interface RChartPoint {
  timestamp_ms: number;
  cm_R: number;
  tinyml_R?: number;
}

export type DetectionMethod = "range_status" | "threshold";

/** GT 대비 ToF가 이 값 이상 짧게 읽히면 차단 구간으로 판정 (mm) */
export const BLOCKED_THRESHOLD_MM = 40;

/** R̂ 시계열 및 차트 표시용 클램프 상한 (mm²) */
export const R_CLAMP_MAX = 10000;

/** algoId별 estimate 컬럼 반환. */
export function getEstimate(row: E1Row, algoId: E1AlgorithmId): number | undefined {
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
 *   2. 없으면 복원 GT 기준: (gt[i] - tof[i]) > BLOCKED_THRESHOLD_MM
 *      → 차단재가 센서와 로봇 사이에 있을 때 tof가 실제 위치보다 짧게 읽히는 원리
 *
 * gt_distance_mm가 전부 0인 CSV에서도 getGroundTruth(rows)가 복원한 GT를
 * 사용하므로 정상 탐지된다.
 */
export function detectBlockedIntervals(
  rows: E1Row[],
  gt: number[],
): { intervals: BlockedInterval[]; method: DetectionMethod } {
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
      // gt가 충분히 큰 구간(> 100mm)에서만 적용해 종단 노이즈 오탐을 방지
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

/** 위치 차트 Y축 도메인 — 데이터 범위에 4% 또는 최소 8mm 여백 부여 */
export function paddedPositionDomain(values: number[]): [number, number] {
  if (values.length === 0) return [0, 600];
  const min = values.reduce((m, value) => Math.min(m, value), Infinity);
  const max = values.reduce((m, value) => Math.max(m, value), -Infinity);
  const span = Math.max(max - min, 1);
  const pad = Math.max(span * 0.04, 8);
  return [Math.max(0, Math.floor(min - pad)), Math.ceil(max + pad)];
}

/**
 * X축 tick 산출. 포인트가 10개 이하면 recharts 기본값(undefined)에 위임하고,
 * 그보다 많으면 약 8등분한 지점 + 마지막 지점을 tick으로 사용한다.
 */
export function buildTimeTicks(timestamps: number[]): number[] | undefined {
  if (timestamps.length <= 10) return undefined;
  const step = Math.floor(timestamps.length / 8);
  const ticks: number[] = [];
  for (let i = 0; i < timestamps.length; i += step) ticks.push(timestamps[i]);
  const last = timestamps[timestamps.length - 1];
  if (ticks[ticks.length - 1] !== last) ticks.push(last);
  return ticks;
}
