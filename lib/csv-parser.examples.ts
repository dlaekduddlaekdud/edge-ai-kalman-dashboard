import { strict as assert } from "node:assert";
import { parseKFCSV, REQUIRED_COLUMNS_25 } from "./csv-parser";

// 25컬럼 유효 CSV 헤더
const VALID_HEADER = REQUIRED_COLUMNS_25.join(",");

// 25컬럼 유효 데이터 행 (seq, timestamp_ms, tof_distance_mm, tof_signal_rate(null), tof_range_status(null),
// us_distance_mm(null), encoder_distance_mm, encoder_speed_mms, sensor_disagree(null), tof_meas_rate(null),
// gt_distance_mm, scenario_id,
// fixed_estimate_mm, fixed_residual, fixed_residual_var(null), fixed_residual_mean(null), fixed_kalman_gain, fixed_innovation_cov,
// cm_estimate_mm, cm_residual, cm_residual_var(null), cm_residual_mean(null), cm_kalman_gain, cm_innovation_cov, cm_R)
const validRow1 = "1,100,,,,95,0,98,,30,100,E1,99,1,,, 0.2,5,100,1.5,,, 0.21,5.1,4";
const validRow2 = "2,200,12.5,0,0,99,11,100,0,31,101,E3,100,2,0.5,2.1,0.21,5.1,101,2,0.6,2.5,0.22,5.2,4.1";

const validCSV = `${VALID_HEADER}\n${validRow1}\n${validRow2}`;

/**
 * 테스트 프레임워크 도입 전 CSV parser 검증용 예시.
 * 추후 Vitest/Jest 등을 추가하면 아래 케이스를 정식 단위 테스트로 옮긴다.
 */
export function runCSVParserExamples(): void {
  const rows = parseKFCSV(validCSV);

  assert.equal(rows.length, 2);
  assert.equal(rows[0]?.tof_signal_rate, null);
  assert.equal(rows[0]?.sensor_disagree, null);
  assert.equal(rows[1]?.us_distance_mm, 99);
  assert.equal(rows[1]?.scenario_id, "E3");

  // nullable 컬럼 null 처리 확인
  assert.equal(rows[0]?.fixed_residual_var, null);
  assert.equal(rows[0]?.cm_residual_var, null);

  assert.throws(
    () => parseKFCSV("timestamp_ms\n0"),
    /missing required column/,
  );
}
