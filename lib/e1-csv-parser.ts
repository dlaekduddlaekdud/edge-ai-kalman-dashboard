import Papa from "papaparse";

export type RunId = "run1" | "run2" | "run3" | "run4" | "run5";
export const ALL_RUNS: RunId[] = ["run1", "run2", "run3", "run4", "run5"];

export const RUN_LABELS: Record<RunId | "all", string> = {
  run1: "Run 1",
  run2: "Run 2",
  run3: "Run 3",
  run4: "Run 4",
  run5: "Run 5",
  all: "All (평균)",
};

const E1_REQUIRED_COLUMNS = [
  "seq", "timestamp_ms", "tof_distance_mm", "tof_signal_rate", "tof_range_status",
  "us_distance_mm", "encoder_distance_mm", "encoder_speed_mms", "sensor_disagree",
  "tof_meas_rate", "gt_distance_mm", "scenario_id",
  "fixed_estimate_mm", "fixed_residual", "fixed_residual_var", "fixed_residual_mean",
  "fixed_kalman_gain", "fixed_innovation_cov",
  "cm_estimate_mm", "cm_residual", "cm_residual_var", "cm_residual_mean",
  "cm_kalman_gain", "cm_innovation_cov", "cm_R",
] as const;

const E1_TINYML_COLUMNS = ["tinyml_estimate_mm", "tinyml_R", "tinyml_infer_us"] as const;

const E1_NULLABLE_COLUMNS = new Set<string>([
  "tof_signal_rate", "tof_range_status", "us_distance_mm", "sensor_disagree", "tof_meas_rate",
  "fixed_residual_var", "fixed_residual_mean",
  "cm_residual_var", "cm_residual_mean",
]);

export interface E1Row {
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
  scenario_id: number | string;
  fixed_estimate_mm: number;
  fixed_residual: number;
  fixed_residual_var: number | null;
  fixed_residual_mean: number | null;
  fixed_kalman_gain: number;
  fixed_innovation_cov: number;
  cm_estimate_mm: number;
  cm_residual: number;
  cm_residual_var: number | null;
  cm_residual_mean: number | null;
  cm_kalman_gain: number;
  cm_innovation_cov: number;
  cm_R: number;
  // TinyML optional (28-column CSV)
  tinyml_estimate_mm?: number;
  tinyml_R?: number;
  tinyml_infer_us?: number;
}

type RawRow = Record<string, string | undefined>;

function normalizeHeader(h: string): string {
  return h.trim();
}

function parseCell(row: RawRow, col: string, rowNum: number): number | null {
  const raw = row[col];
  const label = `row ${rowNum}, column "${col}"`;
  if (raw === undefined) throw new RangeError(`${label} is missing.`);
  const trimmed = raw.trim();
  if (trimmed === "") {
    if (E1_NULLABLE_COLUMNS.has(col)) return null;
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

function parseScenarioId(row: RawRow, rowNum: number): number | string {
  const raw = row["scenario_id"];
  const label = `row ${rowNum}, column "scenario_id"`;
  if (raw === undefined) throw new RangeError(`${label} is missing.`);
  const trimmed = raw.trim();
  if (trimmed === "") throw new TypeError(`${label} must not be empty.`);
  const num = Number(trimmed);
  if (Number.isFinite(num)) return num;
  if (/^E\d+$/i.test(trimmed)) return trimmed.toUpperCase();
  throw new TypeError(
    `${label} must be a finite number or scenario label like "E0". Received "${raw}".`,
  );
}

/** 28컬럼 TinyML 헤더가 모두 있는지 확인 */
export function hasTinyMLColumns(headers: string[]): boolean {
  return E1_TINYML_COLUMNS.every((col) => headers.includes(col));
}

/** 파일명에서 RunId 파싱. E1_run01.csv → "run1" */
export function parseRunFromFileName(fileName: string): RunId | null {
  const match = fileName.match(/run0?(\d+)/i);
  if (!match) return null;
  const n = parseInt(match[1], 10);
  if (n < 1 || n > 5) return null;
  return `run${n}` as RunId;
}

/**
 * E1 실험 CSV (25컬럼 또는 28컬럼) 파싱.
 * TinyML 3컬럼이 모두 있을 때만 TinyML 필드를 파싱하고 없으면 undefined로 둔다.
 */
export function parseE1CSV(csvText: string): E1Row[] {
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
  const missingCols = E1_REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
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
    const parsed: E1Row = {
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
      parsed.tinyml_R = parseRequired(row, "tinyml_R", rowNum);
      parsed.tinyml_estimate_mm = parseRequired(row, "tinyml_estimate_mm", rowNum);
      parsed.tinyml_infer_us = parseRequired(row, "tinyml_infer_us", rowNum);
    }

    return parsed;
  });
}
