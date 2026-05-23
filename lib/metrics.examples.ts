import { strict as assert } from "node:assert";
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

function assertAlmostEqual(actual: number, expected: number, epsilon = 1e-10): void {
  assert.ok(
    Math.abs(actual - expected) <= epsilon,
    `Expected ${actual} to be close to ${expected}.`,
  );
}

/**
 * 테스트 프레임워크 도입 전 순수 함수 검증용 예시.
 * 추후 Vitest/Jest 등을 추가하면 아래 케이스를 정식 단위 테스트로 옮긴다.
 */
export function runMetricExamples(): void {
  assertAlmostEqual(calculateRMSE([2, 4, 6], [1, 4, 9]), Math.sqrt(10 / 3));
  assertAlmostEqual(calculateMAE([2, 4, 6], [1, 4, 9]), 4 / 3);
  assertAlmostEqual(calculateNISPassRate([1, 2, 3], [1, 1, 1]), 2 / 3);

  // calculateTconv: 50 frame 미만이면 null
  assert.equal(calculateTconv([1, 2, 3], [1, 1, 1], [100, 200, 300]), null);

  // calculateRMSEss
  const ests = Array.from({ length: 60 }, (_, i) => i + 1);
  const gts  = Array.from({ length: 60 }, (_, i) => i + 1.5);
  const rmse = calculateRMSEss(ests, gts);
  assert.ok(rmse > 0, "RMSEss should be positive");

  // calculateRMean
  assertAlmostEqual(calculateRMean([2, 4, 6]), 4);

  // calculateRDriftCV
  const cv = calculateRDriftCV([10, 10, 10]);
  assertAlmostEqual(cv, 0);

  // calculateLabelTracking
  assertAlmostEqual(calculateLabelTracking([1, 2, 3], [1, 2, 4]), 1 / 3);

  assert.throws(() => calculateRMSE([1, 2], [1]), /same length/);
  assert.throws(() => calculateMAE([1, Number.NaN], [1, 2]), /finite number/);
  assert.throws(() => calculateNISPassRate([1], [0]), /greater than 0/);
}
