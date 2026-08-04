import { describe, expect, it } from "vitest";
import { parseKFCSV, REQUIRED_COLUMNS_25 } from "./csv-parser";

const VALID_HEADER = REQUIRED_COLUMNS_25.join(",");

/**
 * 25컬럼 스키마 기준 테스트 행.
 * row1: nullable 컬럼(tof_signal_rate, sensor_disagree, *_residual_var 등)이 빈 값인 경우
 * row2: 모든 컬럼이 채워진 경우
 */
const ROW_WITH_NULLS = "1,100,12.0,,,95,0,98,,30,100,E1,99,1,,,0.2,5,100,1.5,,,0.21,5.1,4";
const ROW_FULL = "2,200,12.5,0,0,99,11,100,0,31,101,E3,100,2,0.5,2.1,0.21,5.1,101,2,0.6,2.5,0.22,5.2,4.1";

const validCSV = `${VALID_HEADER}\n${ROW_WITH_NULLS}\n${ROW_FULL}`;

describe("parseKFCSV — 정상 파싱", () => {
  it("헤더를 제외한 데이터 행 수만큼 파싱한다", () => {
    expect(parseKFCSV(validCSV)).toHaveLength(2);
  });

  it("숫자 컬럼을 number로 변환한다", () => {
    const rows = parseKFCSV(validCSV);

    expect(rows[1]?.us_distance_mm).toBe(99);
  });

  it("scenario_id를 문자열로 유지한다", () => {
    const rows = parseKFCSV(validCSV);

    expect(rows[1]?.scenario_id).toBe("E3");
  });
});

describe("parseKFCSV — nullable 컬럼 처리", () => {
  it("센서 관련 nullable 컬럼의 빈 값을 null로 변환한다", () => {
    const rows = parseKFCSV(validCSV);

    expect(rows[0]?.tof_signal_rate).toBeNull();
    expect(rows[0]?.sensor_disagree).toBeNull();
  });

  it("알고리즘별 residual_var 빈 값을 null로 변환한다", () => {
    const rows = parseKFCSV(validCSV);

    expect(rows[0]?.fixed_residual_var).toBeNull();
    expect(rows[0]?.cm_residual_var).toBeNull();
  });
});

describe("parseKFCSV — 스키마 검증", () => {
  it("필수 컬럼이 빠지면 예외를 던진다", () => {
    expect(() => parseKFCSV("timestamp_ms\n0")).toThrow(/missing required column/);
  });
});
