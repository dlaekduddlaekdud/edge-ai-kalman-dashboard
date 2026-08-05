import { describe, expect, it } from "vitest";
import {
  DIVERGENCE_RATIO_VS_CM,
  DIVERGENCE_RMSE_MM,
  isDiverged,
  parseAblationHoldout,
} from "@/lib/ablation-holdout";

describe("isDiverged — 절대 RMSE 임계", () => {
  it("임계값을 넘으면 열화로 판정한다", () => {
    expect(isDiverged(DIVERGENCE_RMSE_MM + 0.01, 1000)).toBe(true);
  });

  it("임계값과 정확히 같으면 열화가 아니다", () => {
    expect(isDiverged(DIVERGENCE_RMSE_MM, 1000)).toBe(false);
  });

  it("논문 표 5-3의 E2 acryl run03(97.00mm)을 검출한다", () => {
    expect(isDiverged(97.0, 32.86)).toBe(true);
  });
});

describe("isDiverged — CM 대비 비율 임계", () => {
  it("절대값이 낮아도 CM의 배수 기준을 넘으면 열화로 판정한다", () => {
    const cm = 10;
    expect(isDiverged(cm * DIVERGENCE_RATIO_VS_CM + 0.01, cm)).toBe(true);
  });

  it("정확히 배수와 같으면 열화가 아니다", () => {
    const cm = 10;
    expect(isDiverged(cm * DIVERGENCE_RATIO_VS_CM, cm)).toBe(false);
  });

  it("CM보다 낮으면 열화가 아니다", () => {
    expect(isDiverged(15, 20)).toBe(false);
  });

  it("cm이 0이면 비율 기준이 무력화되고 절대 기준만 남는다", () => {
    // 0 * 2 = 0 이므로 tinyml3f > 0 이면 항상 true가 된다.
    // 현재 데이터에 cm=0은 없으나 동작을 명시해 둔다.
    expect(isDiverged(1, 0)).toBe(true);
  });
});

const CSV_HEADER = "scenario,n,rmse_fixed,rmse_cm,rmse_3feat";

describe("parseAblationHoldout", () => {
  it("정상 CSV를 파싱하고 N 가중 평균을 낸다", () => {
    const csv = [
      CSV_HEADER,
      "E2_white_run03,100,20,10,15",
      "E2_acryl_run03,300,40,30,35",
    ].join("\n");

    const { rows, weightedAvg, droppedRows } = parseAblationHoldout(csv);

    expect(rows).toHaveLength(2);
    expect(droppedRows).toEqual([]);
    // fixed: (20*100 + 40*300) / 400 = 35
    expect(weightedAvg?.fixed).toBeCloseTo(35, 5);
    expect(weightedAvg?.n).toBe(400);
  });

  it("시나리오 이름의 밑줄을 공백으로 바꾼다", () => {
    const csv = [CSV_HEADER, "E2_white_run03,10,20,10,15"].join("\n");

    expect(parseAblationHoldout(csv).rows[0].scenario).toBe("E2 white run03");
  });

  it("cmVs3fDiff는 3feat − cm 이다", () => {
    const csv = [CSV_HEADER, "E1,10,20,10,15"].join("\n");

    expect(parseAblationHoldout(csv).rows[0].cmVs3fDiff).toBeCloseTo(5, 5);
  });

  it("수치가 깨진 행은 제외하고 행 번호를 보고한다", () => {
    const csv = [
      CSV_HEADER,
      "E1,100,20,10,15",
      "E2_broken,abc,20,10,15",   // n이 숫자가 아님
      "E3,200,30,,25",            // rmse_cm 누락
      "E5,100,20,10,15",
    ].join("\n");

    const { rows, droppedRows, weightedAvg } = parseAblationHoldout(csv);

    expect(rows).toHaveLength(2);
    expect(droppedRows).toEqual([2, 3]);
    // 제외 후 남은 2행(N=100씩)만으로 평균이 계산돼야 한다
    expect(weightedAvg?.n).toBe(200);
  });

  it("유효 행이 하나도 없으면 weightedAvg가 null이다", () => {
    const csv = [CSV_HEADER, "E1,abc,def,ghi,jkl"].join("\n");

    const { rows, weightedAvg, droppedRows } = parseAblationHoldout(csv);

    expect(rows).toEqual([]);
    expect(weightedAvg).toBeNull();
    expect(droppedRows).toEqual([1]);
  });

  it("헤더만 있으면 빈 결과를 반환한다", () => {
    const { rows, weightedAvg } = parseAblationHoldout(CSV_HEADER);

    expect(rows).toEqual([]);
    expect(weightedAvg).toBeNull();
  });
});