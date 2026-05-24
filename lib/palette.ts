/**
 * 알고리즘 색상 및 시맨틱 색상 단일 진실 소스.
 * 모든 page/component는 여기서 import한다.
 *
 * 색상 하나에만 의미를 맡기지 말고 라벨·border·font-weight를 함께 사용한다.
 */

/** 알고리즘별 UI/차트 색상 */
export const algorithmStyles = {
  raw: {
    bg: "#F8FAFC",
    text: "#334155",
    border: "#CBD5E1",
    chart: "#6B7280",
  },
  fixed: {
    bg: "#EEF2FF",
    text: "#1E3A8A",
    border: "#C7D2FE",
    chart: "#2563EB",
  },
  cmAkf: {
    bg: "#FDF2F8",
    text: "#9D174D",
    border: "#FBCFE8",
    chart: "#DB2777",
  },
  tinymlAkf: {
    bg: "#F5F3FF",
    text: "#5B21B6",
    border: "#DDD6FE",
    chart: "#7C3AED",
  },
} as const;

/** 기존 AlgorithmId(raw/fixed/cm/tinyml)로 바로 찾기 위한 alias */
export const algorithmStyleById = {
  raw: algorithmStyles.raw,
  fixed: algorithmStyles.fixed,
  cm: algorithmStyles.cmAkf,
  tinyml: algorithmStyles.tinymlAkf,
} as const;

/** 차트/점/막대 전용 색상. 버튼 배경에는 쓰지 않는다. */
export const algorithmColors = {
  /** Raw ToF — 원본 기준선 */
  raw: algorithmStyles.raw.chart,
  /** Fixed KF — 안정적 baseline */
  fixed: algorithmStyles.fixed.chart,
  /** CM-AKF — covariance matching 적응 필터 */
  cm: algorithmStyles.cmAkf.chart,
  /** TinyML-AKF — Edge AI 대안 */
  tinyml: algorithmStyles.tinymlAkf.chart,
} as const;

export type AlgorithmId = keyof typeof algorithmColors;

/** 시맨틱 UI 색상 */
export const semanticColors = {
  /** 브랜드/내비게이션/CTA */
  brand: "#1f4f8f",
  /** 성능 향상 표시 (초록) */
  positive: "#15803d",
  /** 성능 열화·비정상/위험 신호 (빨강) */
  danger: "#DC2626",
  /** 경고 텍스트 (주황) */
  warning: "#B45309",
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
