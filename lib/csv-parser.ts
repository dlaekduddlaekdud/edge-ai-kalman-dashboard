import Papa from "papaparse";

// 공통 12컬럼
const COMMON_COLUMNS = [
  "seq", "timestamp_ms", "tof_distance_mm", "tof_signal_rate", "tof_range_status",
  "us_distance_mm", "encoder_distance_mm", "encoder_speed_mms", "sensor_disagree",
  "tof_meas_rate", "gt_distance_mm", "scenario_id",
] as const;

// Fixed KF 6컬럼
const FIXED_KF_COLUMNS = [
  "fixed_estimate_mm", "fixed_residual", "fixed_residual_var",
  "fixed_residual_mean", "fixed_kalman_gain", "fixed_innovation_cov",
] as const;

// CM-AKF 7컬럼
const CM_AKF_COLUMNS = [
  "cm_estimate_mm", "cm_residual", "cm_residual_var", "cm_residual_mean",
  "cm_kalman_gain", "cm_innovation_cov", "cm_R",
] as const;

// TinyML 3컬럼 (2차 측정에만 존재)
const TINYML_COLUMNS = [
  "tinyml_estimate_mm", "tinyml_R", "tinyml_infer_us",
] as const;

export const REQUIRED_COLUMNS_25 = [
  ...COMMON_COLUMNS, ...FIXED_KF_COLUMNS, ...CM_AKF_COLUMNS,
] as const;

// nullable 컬럼 집합
const NULLABLE_COLUMN_SET = new Set<string>([
  "tof_signal_rate", "tof_range_status", "us_distance_mm", "sensor_disagree", "tof_meas_rate",
  "fixed_residual_var", "fixed_residual_mean",
  "cm_residual_var", "cm_residual_mean",
]);

export type ScenarioId = number | `E${number}`;

export interface KFRow {
  // 공통 12
  seq: number;
  timestamp_ms: number;
  tof_distance_mm: number;
  tof_signal_rate: number | null;
  tof_range_status: number | null;
  us_distance_mm: number | null;
  encoder_distance_mm: number;
  encoder_speed_mms: number;
  sensor_disagree: number | null;
  tof_meas_rate: number | null;
  gt_distance_mm: number;
  scenario_id: ScenarioId;
  // Fixed KF 6
  fixed_estimate_mm: number;
  fixed_residual: number;
  fixed_residual_var: number | null;
  fixed_residual_mean: number | null;
  fixed_kalman_gain: number;
  fixed_innovation_cov: number;
  // CM-AKF 7
  cm_estimate_mm: number;
  cm_residual: number;
  cm_residual_var: number | null;
  cm_residual_mean: number | null;
  cm_kalman_gain: number;
  cm_innovation_cov: number;
  cm_R: number;
  // TinyML 3 (optional — 1차 측정 CSV에는 없음)
  tinyml_estimate_mm?: number;
  tinyml_R?: number;
  tinyml_infer_us?: number;
}

type RawRow = Record<string, string | undefined>;

function normalizeHeader(h: string): string {
  return h.trim();
}

/** 28컬럼 TinyML 헤더가 모두 있는지 확인 */
export function hasTinyMLColumns(headers: string[]): boolean {
  return TINYML_COLUMNS.every((col) => headers.includes(col));
}

function parseCell(row: RawRow, col: string, rowNum: number): number | null {
  const raw = row[col];
  const label = `row ${rowNum}, column "${col}"`;
  if (raw === undefined) throw new RangeError(`${label} is missing.`);
  const trimmed = raw.trim();
  if (trimmed === "") {
    if (NULLABLE_COLUMN_SET.has(col)) return null;
    throw new TypeError(`${label} must be a number and cannot be empty.`);
  }
  const num = Number(trimmed);
  if (!Number.isFinite(num))
    throw new TypeError(`${label} must be a finite number. Received "${raw}".`);
  return num;
}

function parseRequired(row: RawRow, col: string, rowNum: number): number {
  const val = parseCell(row, col, rowNum);
  if (val === null)
    throw new TypeError(`row ${rowNum}, column "${col}" cannot be empty.`);
  return val;
}

function parseScenarioId(row: RawRow, rowNum: number): ScenarioId {
  const raw = row["scenario_id"];
  const label = `row ${rowNum}, column "scenario_id"`;
  if (raw === undefined) throw new RangeError(`${label} is missing.`);
  const trimmed = raw.trim();
  if (trimmed === "") throw new TypeError(`${label} must not be empty.`);
  const num = Number(trimmed);
  if (Number.isFinite(num)) return num;
  if (/^E\d+$/i.test(trimmed)) return trimmed.toUpperCase() as ScenarioId;
  throw new TypeError(
    `${label} must be a finite number or scenario label like "E0". Received "${raw}".`,
  );
}

/**
 * 논문 최종 스키마 기준 CSV 파싱 (25컬럼 또는 28컬럼).
 * 25컬럼 미만(REQUIRED_COLUMNS_25 기준) 또는 필수 컬럼 누락 시 RangeError.
 * 28컬럼(hasTinyMLColumns)이면 TinyML 3컬럼도 파싱.
 */
export function parseKFCSV(csvText: string): KFRow[] {
  if (typeof csvText !== "string" || csvText.trim().length === 0) {
    throw new RangeError("CSV text must not be empty.");
  }

  const result = Papa.parse<RawRow>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeader,
    dynamicTyping: false,
  });

  const fatalError = result.errors.find((e) => e.code !== "UndetectableDelimiter");
  if (fatalError) {
    const suffix = typeof fatalError.row === "number" ? ` at row ${fatalError.row + 2}` : "";
    throw new SyntaxError(`CSV parse error${suffix}: ${fatalError.message}`);
  }

  const headers = result.meta.fields ?? [];
  const missingCols = REQUIRED_COLUMNS_25.filter((col) => !headers.includes(col));
  if (missingCols.length > 0) {
    throw new RangeError(
      `CSV header is missing required column(s): ${missingCols.join(", ")}.`,
    );
  }

  if (result.data.length === 0) {
    throw new RangeError("CSV must contain at least one data row.");
  }

  const withTinyML = hasTinyMLColumns(headers);

  return result.data.map((row, i) => {
    const rowNum = i + 2;
    const parsed: KFRow = {
      seq: parseRequired(row, "seq", rowNum),
      timestamp_ms: parseRequired(row, "timestamp_ms", rowNum),
      tof_distance_mm: parseRequired(row, "tof_distance_mm", rowNum),
      tof_signal_rate: parseCell(row, "tof_signal_rate", rowNum),
      tof_range_status: parseCell(row, "tof_range_status", rowNum),
      us_distance_mm: parseCell(row, "us_distance_mm", rowNum),
      encoder_distance_mm: parseRequired(row, "encoder_distance_mm", rowNum),
      encoder_speed_mms: parseRequired(row, "encoder_speed_mms", rowNum),
      sensor_disagree: parseCell(row, "sensor_disagree", rowNum),
      tof_meas_rate: parseCell(row, "tof_meas_rate", rowNum),
      gt_distance_mm: parseRequired(row, "gt_distance_mm", rowNum),
      scenario_id: parseScenarioId(row, rowNum),
      fixed_estimate_mm: parseRequired(row, "fixed_estimate_mm", rowNum),
      fixed_residual: parseRequired(row, "fixed_residual", rowNum),
      fixed_residual_var: parseCell(row, "fixed_residual_var", rowNum),
      fixed_residual_mean: parseCell(row, "fixed_residual_mean", rowNum),
      fixed_kalman_gain: parseRequired(row, "fixed_kalman_gain", rowNum),
      fixed_innovation_cov: parseRequired(row, "fixed_innovation_cov", rowNum),
      cm_estimate_mm: parseRequired(row, "cm_estimate_mm", rowNum),
      cm_residual: parseRequired(row, "cm_residual", rowNum),
      cm_residual_var: parseCell(row, "cm_residual_var", rowNum),
      cm_residual_mean: parseCell(row, "cm_residual_mean", rowNum),
      cm_kalman_gain: parseRequired(row, "cm_kalman_gain", rowNum),
      cm_innovation_cov: parseRequired(row, "cm_innovation_cov", rowNum),
      cm_R: parseRequired(row, "cm_R", rowNum),
    };

    if (withTinyML) {
      parsed.tinyml_estimate_mm = parseRequired(row, "tinyml_estimate_mm", rowNum);
      parsed.tinyml_R = parseRequired(row, "tinyml_R", rowNum);
      parsed.tinyml_infer_us = parseRequired(row, "tinyml_infer_us", rowNum);
    }

    return parsed;
  });
}
