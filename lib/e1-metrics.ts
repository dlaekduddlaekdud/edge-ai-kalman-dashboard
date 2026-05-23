import type { E1Row } from "@/lib/e1-csv-parser";
import { calculateRMSE, calculateMAE, calculateNISPassRate } from "@/lib/metrics";

/**
 * stop 구간(encoder == 0)의 tof 평균을 기준점으로 GT 복원.
 * gt[k] = base - encoder_distance_mm[k]
 */
export function reconstructGT(rows: E1Row[]): number[] {
  const stopRows = rows.filter((r) => r.encoder_distance_mm === 0);
  const base =
    stopRows.length > 0
      ? stopRows.reduce((s, r) => s + r.tof_distance_mm, 0) / stopRows.length
      : rows[0].tof_distance_mm;
  return rows.map((r) => base - r.encoder_distance_mm);
}

/** encoder > 0 인 첫 행 인덱스 (moving phase 시작). 없으면 0. */
export function getMovingPhaseStart(rows: E1Row[]): number {
  const idx = rows.findIndex((r) => r.encoder_distance_mm > 0);
  return idx === -1 ? 0 : idx;
}

/** autoExcludeStop + tailTrim 적용 후 분석 대상 rows 반환 */
export function applyTrim(
  rows: E1Row[],
  autoExcludeStop: boolean,
  trimTail: number,
): E1Row[] {
  const start = autoExcludeStop ? getMovingPhaseStart(rows) : 0;
  const end = rows.length - Math.max(0, trimTail);
  if (start >= end) return [];
  return rows.slice(start, end);
}

export interface E1AlgorithmMetrics {
  rmse: number;
  mae: number;
  nisPassRate?: number;
}

export interface E1RunMetrics {
  raw: E1AlgorithmMetrics;
  fixed: E1AlgorithmMetrics;
  cm: E1AlgorithmMetrics;
  tinyml?: E1AlgorithmMetrics;
  cmRMean: number;
  cmRMin: number;
  cmRMax: number;
}

function safeNISPassRate(nu: number[], S: number[]): number {
  const paired = nu.map((v, i) => ({ v, s: S[i] })).filter((p) => p.s > 0);
  if (paired.length === 0) return 0;
  try {
    return calculateNISPassRate(
      paired.map((p) => p.v),
      paired.map((p) => p.s),
    );
  } catch {
    return 0;
  }
}

/** 트림 적용 rows + 복원 GT로 알고리즘별 메트릭 계산 */
export function calculateE1Metrics(
  rows: E1Row[],
  autoExcludeStop: boolean,
  trimTail: number,
): E1RunMetrics | null {
  const trimmed = applyTrim(rows, autoExcludeStop, trimTail);
  if (trimmed.length === 0) return null;

  const gt = reconstructGT(trimmed);

  const cmRValues = trimmed.map((r) => r.cm_R);

  const tinymlRows = trimmed.filter((r) => r.tinyml_estimate_mm !== undefined);
  const tinyml =
    tinymlRows.length === trimmed.length
      ? {
          rmse: calculateRMSE(trimmed.map((r) => r.tinyml_estimate_mm!), gt),
          mae: calculateMAE(trimmed.map((r) => r.tinyml_estimate_mm!), gt),
          // NIS: TinyML은 innovation_cov 없음. nisPassRate 없음 — 호출부에서 "—" 표시
        }
      : undefined;

  return {
    raw: {
      rmse: calculateRMSE(trimmed.map((r) => r.tof_distance_mm), gt),
      mae: calculateMAE(trimmed.map((r) => r.tof_distance_mm), gt),
    },
    fixed: {
      rmse: calculateRMSE(trimmed.map((r) => r.fixed_estimate_mm), gt),
      mae: calculateMAE(trimmed.map((r) => r.fixed_estimate_mm), gt),
      nisPassRate: safeNISPassRate(
        trimmed.map((r) => r.fixed_residual),
        trimmed.map((r) => r.fixed_innovation_cov),
      ),
    },
    cm: {
      rmse: calculateRMSE(trimmed.map((r) => r.cm_estimate_mm), gt),
      mae: calculateMAE(trimmed.map((r) => r.cm_estimate_mm), gt),
      nisPassRate: safeNISPassRate(
        trimmed.map((r) => r.cm_residual),
        trimmed.map((r) => r.cm_innovation_cov),
      ),
    },
    tinyml,
    cmRMean: cmRValues.reduce((s, v) => s + v, 0) / cmRValues.length,
    cmRMin: Math.min(...cmRValues),
    cmRMax: Math.max(...cmRValues),
  };
}

/** All 집계: 업로드된 런들의 메트릭 단순 평균 */
export function averageE1Metrics(all: E1RunMetrics[]): E1RunMetrics | null {
  if (all.length === 0) return null;
  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;

  return {
    raw: {
      rmse: avg(all.map((m) => m.raw.rmse)),
      mae: avg(all.map((m) => m.raw.mae)),
    },
    fixed: {
      rmse: avg(all.map((m) => m.fixed.rmse)),
      mae: avg(all.map((m) => m.fixed.mae)),
      nisPassRate: avg(all.map((m) => m.fixed.nisPassRate ?? 0)),
    },
    cm: {
      rmse: avg(all.map((m) => m.cm.rmse)),
      mae: avg(all.map((m) => m.cm.mae)),
      nisPassRate: avg(all.map((m) => m.cm.nisPassRate ?? 0)),
    },
    cmRMean: avg(all.map((m) => m.cmRMean)),
    cmRMin: Math.min(...all.map((m) => m.cmRMin)),
    cmRMax: Math.max(...all.map((m) => m.cmRMax)),
  };
}
