import { strict as assert } from "node:assert";
import { parseKFCSV, REQUIRED_COLUMNS } from "./csv-parser";

const validCSV = `${REQUIRED_COLUMNS.join(",")}
0,100,,0,95,98,10,99,1,2,0.5,,30,100,4,0.2,5,1
100,101,12.5,0,,99,11,100,1.5,2.1,0.6,0,31,101,4.1,0.21,5.1,E3`;

const warmupCSV = `${REQUIRED_COLUMNS.join(",")}
0,109.93,,,,100.0,0.0,109.9343,0.0,,,,,100.0,,0.0,0.0,E0`;

/**
 * 테스트 프레임워크 도입 전 CSV parser 검증용 예시.
 * 추후 Vitest/Jest 등을 추가하면 아래 케이스를 정식 단위 테스트로 옮긴다.
 */
export function runCSVParserExamples(): void {
  const rows = parseKFCSV(validCSV);

  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.tof_signal_rate, null);
  assert.equal(rows[0]?.sensor_disagree, null);
  assert.equal(rows[1]?.us_distance_mm, null);
  assert.equal(rows[1]?.scenario_id, "E3");

  const warmupRows = parseKFCSV(warmupCSV);
  assert.equal(warmupRows[0]?.tof_residual_var, null);
  assert.equal(warmupRows[0]?.tof_residual_mean, null);
  assert.equal(warmupRows[0]?.tof_meas_rate, null);
  assert.equal(warmupRows[0]?.R_label, null);
  assert.equal(warmupRows[0]?.scenario_id, "E0");

  assert.throws(
    () => parseKFCSV("timestamp_ms\n0"),
    /missing required column/,
  );

  assert.throws(
    () =>
      parseKFCSV(
        `${REQUIRED_COLUMNS.join(",")}
0,not-a-number,,0,95,98,10,99,1,2,0.5,,30,100,4,0.2,5,1`,
      ),
    /row 2, column "tof_distance_mm"/,
  );

  assert.throws(
    () =>
      parseKFCSV(
        `${REQUIRED_COLUMNS.join(",")}
0,100,,0,95,98,10,99,1,2,0.5,,30,100,4,0.2,5,not-a-scenario`,
      ),
    /row 2, column "scenario_id"/,
  );
}
