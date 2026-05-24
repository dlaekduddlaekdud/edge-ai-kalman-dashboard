/**
 * 알고리즘 색상 및 시맨틱 색상 단일 진실 소스.
 * 모든 page/component는 여기서 import한다.
 *
 * 색상 하나에만 의미를 맡기지 말고 라벨·border·font-weight를 함께 사용한다.
 */

/** 알고리즘별 고정 색상 */
export const algorithmColors = {
  /** Raw ToF — 원본 기준선 */
  raw: "#71717a",
  /** Fixed KF — 안정적 baseline */
  fixed: "#0f766e",
  /** CM-AKF — covariance matching 적응 필터 */
  cm: "#be123c",
  /** TinyML-AKF — Edge AI 대안 */
  tinyml: "#a16207",
} as const;

export type AlgorithmId = keyof typeof algorithmColors;

/** 시맨틱 UI 색상 */
export const semanticColors = {
  /** 브랜드/내비게이션/CTA */
  brand: "#1f4f8f",
  /** 성능 향상 표시 (초록) */
  positive: "#15803d",
  /** 성능 열화·경고 (빨강) */
  danger: "#b91c1c",
  /** 경고 텍스트 (주황) */
  warning: "#92400e",
  /** 비활성/중립 텍스트 */
  muted: "#64748b",
} as const;

/** results/ablation 페이지 인라인 style에서 바로 쓸 수 있는 단축 객체 */
export const ALGO_COLORS = {
  raw: algorithmColors.raw,
  fixed: algorithmColors.fixed,
  cm: algorithmColors.cm,
  tinyml: algorithmColors.tinyml,
  danger: semanticColors.danger,
} as const;
