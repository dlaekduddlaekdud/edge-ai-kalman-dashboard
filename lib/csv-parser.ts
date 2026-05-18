import Papa from "papaparse";

export const REQUIRED_COLUMNS = [
  "timestamp_ms",
  "tof_distance_mm",
  "tof_signal_rate",
  "tof_range_status",
  "us_distance_mm",
  "encoder_distance_mm",
  "encoder_speed_mms",
  "kf_estimate_mm",
  "tof_residual",
  "tof_residual_var",
  "tof_residual_mean",
  "sensor_disagree",
  "tof_meas_rate",
  "gt_distance_mm",
  "R_label",
  "kalman_gain",
  "innovation_cov",
  "scenario_id",
] as const;

export const NULLABLE_COLUMNS = [
  "tof_signal_rate",
  "tof_range_status",
  "us_distance_mm",
  "tof_residual_var",
  "tof_residual_mean",
  "sensor_disagree",
  "tof_meas_rate",
  "R_label",
] as const;

export type KFColumn = (typeof REQUIRED_COLUMNS)[number];
type NullableColumn = (typeof NULLABLE_COLUMNS)[number];
type RequiredNumberColumn = Exclude<KFColumn, NullableColumn | "scenario_id">;
export type ScenarioId = number | `E${number}`;

export interface KFRow {
  timestamp_ms: number;
  tof_distance_mm: number;
  tof_signal_rate: number | null;
  tof_range_status: number | null;
  us_distance_mm: number | null;
  encoder_distance_mm: number;
  encoder_speed_mms: number;
  kf_estimate_mm: number;
  tof_residual: number;
  tof_residual_var: number | null;
  tof_residual_mean: number | null;
  sensor_disagree: number | null;
  tof_meas_rate: number | null;
  gt_distance_mm: number;
  R_label: number | null;
  kalman_gain: number;
  innovation_cov: number;
  scenario_id: ScenarioId;
}

type RawKFRow = Record<string, string | undefined>;

const NULLABLE_COLUMN_SET: ReadonlySet<KFColumn> = new Set(NULLABLE_COLUMNS);

function isNullableColumn(column: KFColumn): column is NullableColumn {
  return NULLABLE_COLUMN_SET.has(column);
}

function normalizeHeader(value: string): string {
  return value.trim();
}

function assertCSVText(csvText: string): void {
  if (typeof csvText !== "string") {
    throw new TypeError("csvText must be a string.");
  }

  if (csvText.trim().length === 0) {
    throw new RangeError("CSV text must not be empty.");
  }
}

function validateHeaders(fields: readonly string[] | undefined): void {
  if (!fields || fields.length === 0) {
    throw new RangeError("CSV header row is required.");
  }

  const normalizedFields = fields.map(normalizeHeader);
  const missingColumns = REQUIRED_COLUMNS.filter(
    (column) => !normalizedFields.includes(column),
  );

  if (missingColumns.length > 0) {
    throw new RangeError(
      `CSV header is missing required column(s): ${missingColumns.join(", ")}.`,
    );
  }
}

function parseNumberCell(
  row: RawKFRow,
  column: KFColumn,
  rowNumber: number,
): number | null {
  const rawValue = row[column];
  const label = `row ${rowNumber}, column "${column}"`;

  if (rawValue === undefined) {
    throw new RangeError(`${label} is missing.`);
  }

  const trimmedValue = rawValue.trim();

  if (trimmedValue.length === 0) {
    if (isNullableColumn(column)) {
      return null;
    }

    throw new TypeError(`${label} must be a number and cannot be empty.`);
  }

  const numericValue = Number(trimmedValue);

  if (!Number.isFinite(numericValue)) {
    throw new TypeError(
      `${label} must be a finite number. Received "${rawValue}".`,
    );
  }

  return numericValue;
}

function parseRequiredNumberCell(
  row: RawKFRow,
  column: RequiredNumberColumn,
  rowNumber: number,
): number {
  const value = parseNumberCell(row, column, rowNumber);

  if (value === null) {
    throw new TypeError(
      `row ${rowNumber}, column "${column}" must be a number and cannot be empty.`,
    );
  }

  return value;
}

function parseNullableNumberCell(
  row: RawKFRow,
  column: NullableColumn,
  rowNumber: number,
): number | null {
  return parseNumberCell(row, column, rowNumber);
}

function parseScenarioIdCell(row: RawKFRow, rowNumber: number): ScenarioId {
  const column = "scenario_id";
  const rawValue = row[column];
  const label = `row ${rowNumber}, column "${column}"`;

  if (rawValue === undefined) {
    throw new RangeError(`${label} is missing.`);
  }

  const trimmedValue = rawValue.trim();

  if (trimmedValue.length === 0) {
    throw new TypeError(`${label} must not be empty.`);
  }

  const numericValue = Number(trimmedValue);

  if (Number.isFinite(numericValue)) {
    return numericValue;
  }

  if (/^E\d+$/i.test(trimmedValue)) {
    return trimmedValue.toUpperCase() as ScenarioId;
  }

  throw new TypeError(
    `${label} must be a finite number or scenario label like "E0". Received "${rawValue}".`,
  );
}

function parseRawRow(row: RawKFRow, rowNumber: number): KFRow {
  return {
    timestamp_ms: parseRequiredNumberCell(row, "timestamp_ms", rowNumber),
    tof_distance_mm: parseRequiredNumberCell(row, "tof_distance_mm", rowNumber),
    tof_signal_rate: parseNullableNumberCell(row, "tof_signal_rate", rowNumber),
    tof_range_status: parseNullableNumberCell(row, "tof_range_status", rowNumber),
    us_distance_mm: parseNullableNumberCell(row, "us_distance_mm", rowNumber),
    encoder_distance_mm: parseRequiredNumberCell(
      row,
      "encoder_distance_mm",
      rowNumber,
    ),
    encoder_speed_mms: parseRequiredNumberCell(
      row,
      "encoder_speed_mms",
      rowNumber,
    ),
    kf_estimate_mm: parseRequiredNumberCell(row, "kf_estimate_mm", rowNumber),
    tof_residual: parseRequiredNumberCell(row, "tof_residual", rowNumber),
    tof_residual_var: parseNullableNumberCell(row, "tof_residual_var", rowNumber),
    tof_residual_mean: parseNullableNumberCell(
      row,
      "tof_residual_mean",
      rowNumber,
    ),
    sensor_disagree: parseNullableNumberCell(row, "sensor_disagree", rowNumber),
    tof_meas_rate: parseNullableNumberCell(row, "tof_meas_rate", rowNumber),
    gt_distance_mm: parseRequiredNumberCell(row, "gt_distance_mm", rowNumber),
    R_label: parseNullableNumberCell(row, "R_label", rowNumber),
    kalman_gain: parseRequiredNumberCell(row, "kalman_gain", rowNumber),
    innovation_cov: parseRequiredNumberCell(row, "innovation_cov", rowNumber),
    scenario_id: parseScenarioIdCell(row, rowNumber),
  };
}

/**
 * README Data Format 기준 CSV 18컬럼을 파싱하고 KFRow 배열로 변환한다.
 *
 * 필수 헤더가 누락되면 에러를 던진다. 모든 셀은 유한한 숫자로 변환되어야 하며,
 * nullable 컬럼만 빈 문자열을 null로 허용한다. `scenario_id`는 숫자 또는
 * E0, E1 같은 시나리오 label을 허용한다. 가능한 경우 에러 메시지에 CSV row
 * 번호와 column 이름을 포함한다.
 */
export function parseKFCSV(csvText: string): KFRow[] {
  assertCSVText(csvText);

  const result = Papa.parse<RawKFRow>(csvText, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: normalizeHeader,
    dynamicTyping: false,
  });

  const fatalParseError = result.errors.find(
    (error) => error.code !== "UndetectableDelimiter",
  );

  if (fatalParseError) {
    const firstError = fatalParseError;
    const rowSuffix =
      typeof firstError.row === "number" ? ` at row ${firstError.row + 2}` : "";

    throw new SyntaxError(
      `CSV parse error${rowSuffix}: ${firstError.message}`,
    );
  }

  validateHeaders(result.meta.fields);

  if (result.data.length === 0) {
    throw new RangeError("CSV must contain at least one data row.");
  }

  return result.data.map((row, index) => parseRawRow(row, index + 2));
}
