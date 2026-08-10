import type { E1Row } from "@/lib/e1-csv-parser";
import {
  calculateRMSE,
  calculateMAE,
  calculateNISPassRate,
  calculateRMSEss,
  calculateTconv,
} from "@/lib/metrics";

/**
 * GT 복원: CSV gt_distance_mm가 모두 0인 경우 ToF 앵커 + 엔코더 보간으로 재산출.
 * 논문 4.1.2절: GT(k) = ToF_start − (enc(k)/enc_last) × (ToF_start − ToF_end)
 * ToF_start/ToF_end = 양 끝 5 frame tof_distance_mm 평균 (앵커).
 * enc_last < 1 (정적 시나리오)이면 전체 ToF 평균을 상수 GT로 사용.
 */
export function getGroundTruth(rows: E1Row[]): number[] {
  if (rows.length === 0) return [];

  // CSV에 유효한 GT 값이 있으면 그대로 사용
  if (rows.some((r) => r.gt_distance_mm !== 0)) {
    return rows.map((r) => r.gt_distance_mm);
  }

  const ANCHOR = 5;
  const firstN = rows.slice(0, Math.min(ANCHOR, rows.length));
  const lastN  = rows.slice(Math.max(0, rows.length - ANCHOR));

  const tofStart = firstN.reduce((s, r) => s + r.tof_distance_mm, 0) / firstN.length;
  const tofEnd   = lastN.reduce((s, r)  => s + r.tof_distance_mm, 0) / lastN.length;
  const encLast  = rows[rows.length - 1].encoder_distance_mm;

  // 정적 시나리오 (enc_last < 1mm): 전체 ToF 평균을 상수 GT로
  if (encLast < 1) {
    const meanToF = rows.reduce((s, r) => s + r.tof_distance_mm, 0) / rows.length;
    return rows.map(() => meanToF);
  }

  // 동적 시나리오: ToF 앵커 + 엔코더 비율 보간
  return rows.map((r) =>
    tofStart - (r.encoder_distance_mm / encLast) * (tofStart - tofEnd),
  );
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
  /** 후반 50 frame (1초 @ 50Hz) RMSE */
  rmseSS?: number;
  /** 수렴 시간 (ms). null = 수렴 조건 미충족 */
  tconv?: number | null;
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

/**
 * NIS pass rate 계산. undefined는 "유효 샘플 없음"만을 의미한다.
 *
 * calculateNISPassRate는 (1) 길이 불일치 (2) 빈 배열 (3) 비유한 값 (4) S <= 0
 * 에서 throw하지만, 네 조건 모두 이 함수에서는 도달 불가하다.
 *   (1) nu에서 map/filter한 같은 배열이므로 길이가 항상 같다
 *   (2) 아래 early return이 막는다
 *   (3) 파서가 Number.isFinite를 통과시킨 값만 넣는다 (e1-csv-parser.ts)
 *   (4) filter(p => p.s > 0)가 제거한다
 * 따라서 예외를 잡지 않는다. 잡으면 위 불변식이 깨졌을 때 그 사실이
 * 화면의 "—" 뒤에 숨어 원인 추적이 불가능해진다.
 */
function safeNISPassRate(nu: number[], S: number[]): number | undefined {
  const paired = nu.map((v, i) => ({ v, s: S[i] })).filter((p) => p.s > 0);
  if (paired.length === 0) return undefined;
  return calculateNISPassRate(
    paired.map((p) => p.v),
    paired.map((p) => p.s),
  );
}

/** 트림 적용 rows + CSV gt_distance_mm로 알고리즘별 메트릭 계산 */
export function calculateE1Metrics(
  rows: E1Row[],
  autoExcludeStop: boolean,
  trimTail: number,
): E1RunMetrics | null {
  const trimmed = applyTrim(rows, autoExcludeStop, trimTail);
  if (trimmed.length === 0) return null;

  const gt = getGroundTruth(trimmed);
  const timestamps = trimmed.map((r) => r.timestamp_ms);

  const cmRValues = trimmed.map((r) => r.cm_R);

  const rawEst   = trimmed.map((r) => r.tof_distance_mm);
  const fixedEst = trimmed.map((r) => r.fixed_estimate_mm);
  const cmEst    = trimmed.map((r) => r.cm_estimate_mm);

  const tinymlRows = trimmed.filter((r) => r.tinyml_estimate_mm !== undefined);
  const hasTinymlData = tinymlRows.length === trimmed.length;
  const tinymlEst = hasTinymlData ? trimmed.map((r) => r.tinyml_estimate_mm!) : null;

  const tinyml = hasTinymlData && tinymlEst
    ? {
        rmse: calculateRMSE(tinymlEst, gt),
        mae: calculateMAE(tinymlEst, gt),
        // NIS: TinyML은 innovation_cov 없음. nisPassRate 없음 — 호출부에서 "—" 표시
        rmseSS: calculateRMSEss(tinymlEst, gt),
        tconv: calculateTconv(tinymlEst, gt, timestamps),
      }
    : undefined;

  return {
    raw: {
      rmse: calculateRMSE(rawEst, gt),
      mae: calculateMAE(rawEst, gt),
      // Raw ToF는 수렴 개념 없음 — rmseSS/tconv 미계산
    },
    fixed: {
      rmse: calculateRMSE(fixedEst, gt),
      mae: calculateMAE(fixedEst, gt),
      nisPassRate: safeNISPassRate(
        trimmed.map((r) => r.fixed_residual),
        trimmed.map((r) => r.fixed_innovation_cov),
      ),
      rmseSS: calculateRMSEss(fixedEst, gt),
      tconv: calculateTconv(fixedEst, gt, timestamps),
    },
    cm: {
      rmse: calculateRMSE(cmEst, gt),
      mae: calculateMAE(cmEst, gt),
      nisPassRate: safeNISPassRate(
        trimmed.map((r) => r.cm_residual),
        trimmed.map((r) => r.cm_innovation_cov),
      ),
      rmseSS: calculateRMSEss(cmEst, gt),
      tconv: calculateTconv(cmEst, gt, timestamps),
    },
    tinyml,
    cmRMean: cmRValues.reduce((s, v) => s + v, 0) / cmRValues.length,
    // spread 연산자 대신 reduce — 대규모 배열 스택 오버플로우 방지
    cmRMin: cmRValues.reduce((m, v) => Math.min(m, v), Infinity),
    cmRMax: cmRValues.reduce((m, v) => Math.max(m, v), -Infinity),
  };
}

/** All 집계: 업로드된 런들의 메트릭 단순 평균 */
export function averageE1Metrics(all: E1RunMetrics[]): E1RunMetrics | null {
  if (all.length === 0) return null;
  const avg = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / arr.length;
  const avgOptional = (arr: Array<number | undefined>): number | undefined => {
    const valid = arr.filter((v): v is number => typeof v === "number");
    return valid.length > 0 ? avg(valid) : undefined;
  };
  // tconv: null(수렴 못함) 런은 제외하고 평균. 전부 null이면 null.
  const avgTconv = (arr: Array<number | null | undefined>): number | null => {
    const valid = arr.filter((v): v is number => typeof v === "number");
    return valid.length > 0 ? avg(valid) : null;
  };

  const tinymlAll = all.flatMap((m) => (m.tinyml ? [m.tinyml] : []));

  return {
    raw: {
      rmse: avg(all.map((m) => m.raw.rmse)),
      mae: avg(all.map((m) => m.raw.mae)),
    },
    fixed: {
      rmse: avg(all.map((m) => m.fixed.rmse)),
      mae: avg(all.map((m) => m.fixed.mae)),
      nisPassRate: avgOptional(all.map((m) => m.fixed.nisPassRate)),
      rmseSS: avg(all.map((m) => m.fixed.rmseSS ?? m.fixed.rmse)),
      tconv: avgTconv(all.map((m) => m.fixed.tconv)),
    },
    cm: {
      rmse: avg(all.map((m) => m.cm.rmse)),
      mae: avg(all.map((m) => m.cm.mae)),
      nisPassRate: avgOptional(all.map((m) => m.cm.nisPassRate)),
      rmseSS: avg(all.map((m) => m.cm.rmseSS ?? m.cm.rmse)),
      tconv: avgTconv(all.map((m) => m.cm.tconv)),
    },
    tinyml: tinymlAll.length === all.length
      ? {
          rmse: avg(tinymlAll.map((m) => m.rmse)),
          mae: avg(tinymlAll.map((m) => m.mae)),
          rmseSS: avg(tinymlAll.map((m) => m.rmseSS ?? m.rmse)),
          tconv: avgTconv(tinymlAll.map((m) => m.tconv)),
        }
      : undefined,
    cmRMean: avg(all.map((m) => m.cmRMean)),
    cmRMin: Math.min(...all.map((m) => m.cmRMin)),
    cmRMax: Math.max(...all.map((m) => m.cmRMax)),
  };
}
