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
 * 논문 4.3.1 기준 RMSEss (steady-state RMSE).
 * 측정 후반 50 frame (1초 @ 50Hz) 기준 RMSE.
 * 행이 50개 미만이면 전체로 계산.
 */
export function calculateRMSEss(
  estimates: readonly number[],
  gt: readonly number[],
): number {
  const SS_FRAMES = 50;
  if (estimates.length < SS_FRAMES) {
    return calculateRMSE(estimates, gt);
  }
  const ssEst = estimates.slice(-SS_FRAMES);
  const ssGt = gt.slice(-SS_FRAMES);
  return calculateRMSE(ssEst, ssGt);
}

/**
 * 논문 4.3.1 기준 Tconv (수렴 시간).
 * 직전 50 frame 슬라이딩 윈도우 RMSE가 1.1 × RMSEss 이하로 최초 진입하는 시각(ms 단위).
 * 50 frame 미만이거나 조건 미충족 시 null 반환.
 */
export function calculateTconv(
  estimates: readonly number[],
  gt: readonly number[],
  timestamps: readonly number[], // timestamp_ms
): number | null {
  if (estimates.length < 50) return null;
  const rmseSS = calculateRMSEss(estimates, gt);
  const threshold = 1.1 * rmseSS;
  const WINDOW = 50;

  for (let i = WINDOW; i <= estimates.length; i++) {
    const windowEst = estimates.slice(i - WINDOW, i);
    const windowGt = gt.slice(i - WINDOW, i);
    const windowRmse = calculateRMSE(windowEst, windowGt);
    if (windowRmse <= threshold) {
      return timestamps[i - 1]; // ms 단위 반환
    }
  }
  return null;
}

/**
 * E0 전용 Tconv. 절대 임계 epsilon(기본 5mm) 기준.
 * |estimate - gt| <= epsilon 조건을 최초 만족하는 시각(ms).
 */
export function calculateTconvE0(
  estimates: readonly number[],
  gt: readonly number[],
  timestamps: readonly number[],
  epsilon = 5,
): number | null {
  for (let i = 0; i < estimates.length; i++) {
    if (Math.abs(estimates[i] - gt[i]) <= epsilon) {
      return timestamps[i];
    }
  }
  return null;
}

/**
 * R 추정값 평균 (cm_R 표면별 단조성 분석용).
 */
export function calculateRMean(rValues: readonly number[]): number {
  validateFiniteNumberArray(rValues, "rValues");
  return rValues.reduce((s, v) => s + v, 0) / rValues.length;
}

/**
 * R drift CV (변동계수). 30분 장기 안정성 E4 평가용.
 * CV = std(R) / mean(R) × 100. 단위: %.
 */
export function calculateRDriftCV(rValues: readonly number[]): number {
  validateFiniteNumberArray(rValues, "rValues");
  const mean = calculateRMean(rValues);
  if (mean === 0) return 0;
  const variance = rValues.reduce((s, v) => s + (v - mean) ** 2, 0) / rValues.length;
  return (Math.sqrt(variance) / mean) * 100;
}

/**
 * TinyML R 라벨 추적도.
 * MAE(predR, labelR) 반환.
 */
export function calculateLabelTracking(
  predR: readonly number[],
  labelR: readonly number[],
): number {
  return calculateMAE(predR, labelR);
}
