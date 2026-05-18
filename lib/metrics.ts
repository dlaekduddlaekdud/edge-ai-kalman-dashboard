const NIS_LOWER_BOUND_95_DF1 = 0.00098;
const NIS_UPPER_BOUND_95_DF1 = 5.024;

function assertNonEmptyArray(values: readonly unknown[], name: string): void {
  if (values.length === 0) {
    throw new RangeError(`${name} must contain at least one value.`);
  }
}

function assertEqualLength(
  left: readonly unknown[],
  right: readonly unknown[],
  leftName: string,
  rightName: string,
): void {
  if (left.length !== right.length) {
    throw new RangeError(
      `${leftName} and ${rightName} must have the same length. Received ${left.length} and ${right.length}.`,
    );
  }
}

function assertFiniteNumber(value: unknown, label: string): asserts value is number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number.`);
  }
}

function validateFiniteNumberArray(values: readonly number[], name: string): void {
  assertNonEmptyArray(values, name);

  values.forEach((value, index) => {
    assertFiniteNumber(value, `${name}[${index}]`);
  });
}

function validateNonNegativeNumberArray(values: readonly number[], name: string): void {
  validateFiniteNumberArray(values, name);

  values.forEach((value, index) => {
    if (value < 0) {
      throw new RangeError(`${name}[${index}] must be greater than or equal to 0.`);
    }
  });
}

/**
 * README / 논문 4.3.1 기준 RMSE.
 *
 * Definition: sqrt(1/N * sum((x_hat - x_gt)^2)).
 * `estimates`와 `gt`는 같은 길이의 유한한 숫자 배열이어야 하며,
 * null, undefined, NaN, Infinity는 입력 오류로 처리한다.
 */
export function calculateRMSE(
  estimates: readonly number[],
  gt: readonly number[],
): number {
  assertEqualLength(estimates, gt, "estimates", "gt");
  validateFiniteNumberArray(estimates, "estimates");
  validateFiniteNumberArray(gt, "gt");

  const squaredErrorSum = estimates.reduce((sum, estimate, index) => {
    const error = estimate - gt[index];
    return sum + error ** 2;
  }, 0);

  return Math.sqrt(squaredErrorSum / estimates.length);
}

/**
 * README / 논문 4.3.1 기준 MAE.
 *
 * Definition: 1/N * sum(abs(x_hat - x_gt)).
 * `estimates`와 `gt`는 같은 길이의 유한한 숫자 배열이어야 하며,
 * null, undefined, NaN, Infinity는 입력 오류로 처리한다.
 */
export function calculateMAE(
  estimates: readonly number[],
  gt: readonly number[],
): number {
  assertEqualLength(estimates, gt, "estimates", "gt");
  validateFiniteNumberArray(estimates, "estimates");
  validateFiniteNumberArray(gt, "gt");

  const absoluteErrorSum = estimates.reduce((sum, estimate, index) => {
    return sum + Math.abs(estimate - gt[index]);
  }, 0);

  return absoluteErrorSum / estimates.length;
}

/**
 * README / 논문 4.3.1 기준 NIS pass rate.
 *
 * Definition: NIS = nu^2 / S, chi-square(df=1) 95% 양측 구간
 * [0.00098, 5.024] 안에 포함되는 샘플 비율.
 * `nu`와 `S`는 같은 길이의 유한한 숫자 배열이어야 하며,
 * S는 innovation covariance이므로 0보다 커야 한다.
 * null, undefined, NaN, Infinity는 입력 오류로 처리한다.
 */
export function calculateNISPassRate(
  nu: readonly number[],
  S: readonly number[],
): number {
  assertEqualLength(nu, S, "nu", "S");
  validateFiniteNumberArray(nu, "nu");
  validateFiniteNumberArray(S, "S");

  const passCount = nu.reduce((count, residual, index) => {
    const covariance = S[index];

    if (covariance <= 0) {
      throw new RangeError(`S[${index}] must be greater than 0.`);
    }

    const nis = residual ** 2 / covariance;
    const passes =
      nis >= NIS_LOWER_BOUND_95_DF1 && nis <= NIS_UPPER_BOUND_95_DF1;

    return passes ? count + 1 : count;
  }, 0);

  return passCount / nu.length;
}

/**
 * README / 논문 4.3.1 기준 R estimation RMSE.
 *
 * Definition: sqrt(1/N * sum((R_hat - R_label)^2)).
 * `rEst`와 `rLabel`은 같은 길이의 유한한 숫자 배열이어야 하며,
 * null, undefined, NaN, Infinity는 입력 오류로 처리한다.
 */
export function calculateRRMSE(
  rEst: readonly number[],
  rLabel: readonly number[],
): number {
  assertEqualLength(rEst, rLabel, "rEst", "rLabel");
  validateFiniteNumberArray(rEst, "rEst");
  validateFiniteNumberArray(rLabel, "rLabel");

  return calculateRMSE(rEst, rLabel);
}

/**
 * README / 논문 4.3.1 기준 convergence time.
 *
 * Definition: RMSE <= 1.1 * RMSE_ss가 되는 최초 시점.
 * 현재 함수는 별도 timestamp 입력 없이 `rmseTS` 배열에서 조건을 처음 만족하는
 * 0-based index를 반환한다. 조건을 만족하는 값이 없으면 null을 반환한다.
 * `rmseTS`는 0 이상의 유한한 숫자 배열이어야 하며, `ssRmse`도 0 이상의
 * 유한한 숫자여야 한다. null, undefined, NaN, Infinity는 입력 오류로 처리한다.
 */
export function calculateTconv(
  rmseTS: readonly number[],
  ssRmse: number,
): number | null {
  validateNonNegativeNumberArray(rmseTS, "rmseTS");
  assertFiniteNumber(ssRmse, "ssRmse");

  if (ssRmse < 0) {
    throw new RangeError("ssRmse must be greater than or equal to 0.");
  }

  const threshold = 1.1 * ssRmse;
  const convergenceIndex = rmseTS.findIndex((rmse) => rmse <= threshold);

  return convergenceIndex === -1 ? null : convergenceIndex;
}
