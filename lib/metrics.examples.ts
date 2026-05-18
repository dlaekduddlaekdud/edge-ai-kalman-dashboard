import { strict as assert } from "node:assert";
import {
  calculateMAE,
  calculateNISPassRate,
  calculateRMSE,
  calculateRRMSE,
  calculateTconv,
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
  assertAlmostEqual(calculateRRMSE([10, 12, 15], [10, 10, 18]), Math.sqrt(13 / 3));

  assert.equal(calculateTconv([12, 9, 5.4, 5.2], 5), 2);
  assert.equal(calculateTconv([12, 9, 6], 5), null);

  assert.throws(() => calculateRMSE([1, 2], [1]), /same length/);
  assert.throws(() => calculateMAE([1, Number.NaN], [1, 2]), /finite number/);
  assert.throws(() => calculateNISPassRate([1], [0]), /greater than 0/);
}
