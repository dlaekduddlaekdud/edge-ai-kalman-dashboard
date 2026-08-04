import { describe, expect, it } from "vitest";
import {
  calculateMAE,
  calculateNISPassRate,
  calculateRMSE,
  calculateTconv,
  calculateRMSEss,
  calculateRMean,
  calculateRDriftCV,
  calculateLabelTracking,
} from "./metrics";

describe("calculateRMSE", () => {
  it("추정값과 실측값의 제곱평균제곱근 오차를 반환한다", () => {
    expect(calculateRMSE([2, 4, 6], [1, 4, 9])).toBeCloseTo(Math.sqrt(10 / 3), 10);
  });

  it("오차가 0이면 0을 반환한다", () => {
    expect(calculateRMSE([1, 2, 3], [1, 2, 3])).toBe(0);
  });

  it("두 배열 길이가 다르면 예외를 던진다", () => {
    expect(() => calculateRMSE([1, 2], [1])).toThrow(/same length/);
  });
});

describe("calculateMAE", () => {
  it("절대오차의 평균을 반환한다", () => {
    expect(calculateMAE([2, 4, 6], [1, 4, 9])).toBeCloseTo(4 / 3, 10);
  });

  it("NaN이 섞이면 예외를 던진다", () => {
    expect(() => calculateMAE([1, Number.NaN], [1, 2])).toThrow(/finite number/);
  });
});

describe("calculateNISPassRate", () => {
  it("신뢰구간 통과 비율을 반환한다", () => {
    expect(calculateNISPassRate([1, 2, 3], [1, 1, 1])).toBeCloseTo(2 / 3, 10);
  });

  it("innovation covariance가 0 이하면 예외를 던진다", () => {
    expect(() => calculateNISPassRate([1], [0])).toThrow(/greater than 0/);
  });
});

describe("calculateTconv", () => {
  it("표본이 50 frame 미만이면 null을 반환한다", () => {
    expect(calculateTconv([1, 2, 3], [1, 1, 1], [100, 200, 300])).toBeNull();
  });
});

describe("calculateRMSEss", () => {
  it("정상상태 구간의 RMSE를 양수로 반환한다", () => {
    const estimates = Array.from({ length: 60 }, (_, i) => i + 1);
    const groundTruth = Array.from({ length: 60 }, (_, i) => i + 1.5);

    expect(calculateRMSEss(estimates, groundTruth)).toBeGreaterThan(0);
  });
});

describe("calculateRMean", () => {
  it("R 추정값의 평균을 반환한다", () => {
    expect(calculateRMean([2, 4, 6])).toBeCloseTo(4, 10);
  });
});

describe("calculateRDriftCV", () => {
  it("값이 일정하면 변동계수가 0이다", () => {
    expect(calculateRDriftCV([10, 10, 10])).toBeCloseTo(0, 10);
  });
});

describe("calculateLabelTracking", () => {
  it("라벨 불일치 비율을 반환한다", () => {
    expect(calculateLabelTracking([1, 2, 3], [1, 2, 4])).toBeCloseTo(1 / 3, 10);
  });
});
