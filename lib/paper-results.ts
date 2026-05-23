/**
 * 논문 확정 수치 단일 진실 소스 (2026-05-23 기준).
 * P0~P2 모든 View/page가 여기서 import.
 * 수치 수정 시 이 파일만 변경하면 전체 반영됨.
 * 새 연구 결과를 창작하지 말 것. 논문에 없는 수치를 추가하지 말 것.
 */

/** std optional — 논문에 기재된 경우만 */
export interface AlgoMetrics {
  rmse: number;
  rmseStd?: number;
  mae: number;
  maeStd?: number;
  nis?: number;       // pass rate (0~1). TinyML은 항상 null
  rmseSS?: number;    // steady-state RMSE (후반 50 frame)
  tconv?: number;     // ms 단위 수렴 시간
}

/**
 * std 있으면 "7.36 ± 1.43", 없으면 "7.36" 포맷.
 */
export function formatMetric(value: number, std?: number, digits = 2): string {
  const base = value.toFixed(digits);
  return std != null ? `${base} ± ${std.toFixed(digits)}` : base;
}

export const PAPER_RESULTS = {

  // ── E0: Python 합성 시뮬레이션 ─────────────────────────────────────────
  E0: {
    description: "2,000 step Python 합성 데이터 — Fixed KF 단독 검증",
    rawRMSE: 20.04,
    kfRMSE: 4.26,
    improvement: 78.7,     // %
    pSS: 19.51,            // mm² (Riccati 해석해 일치)
    kSS: 0.049,
    nisPassRate: 0.955,    // 95.5%
    nisInterval: [0.00098, 5.024] as [number, number],
    tconv: 0.120,          // s (24 step, E0 전용 ε=5mm 기준)
    tconvSteps: 24,
    slidingWindow: 20,     // W=20 warm-up 제외
    slidingWindowNote: "분산 추정 안정성 vs 환경 변화 반응 속도 trade-off. W=20 vs W=30 비교 결과.",
  },

  // ── E1: 정상 baseline ──────────────────────────────────────────────────
  E1: {
    description: "정상 baseline — 5 run, 1,167 frames",
    runs: 5,
    totalFrames: 1167,
    raw:    { rmse: 7.36, rmseStd: 1.43, mae: 5.80, maeStd: 1.12 } as AlgoMetrics,
    fixed:  { rmse: 5.41, mae: 4.22, nis: 0.957, rmseSS: 2.15, tconv: 3016 } as AlgoMetrics,
    cm:     { rmse: 5.58, mae: 4.37, nis: 0.965, rmseSS: 2.38, tconv: 2300 } as AlgoMetrics,
    tinyml: { rmse: 5.76, mae: 4.51, nis: undefined, rmseSS: 2.35, tconv: 2320 } as AlgoMetrics,
    // nis: undefined → TinyML NIS는 항상 "—" (innovation_cov 컬럼 없음)
  },

  // ── E2: 벽 표면별 ──────────────────────────────────────────────────────
  E2: {
    description: "벽 3종 × 3 run — 표면별 반사 특성 비교",
    surfaces: {
      white: {
        label: "흰 우드락",
        runs: 3, totalFrames: 706,
        raw:    { rmse: 12.63, mae: 9.08 } as AlgoMetrics,
        fixed:  { rmse: 9.72, mae: 6.96, nis: 0.949, rmseSS: 1.73, tconv: 3273 } as AlgoMetrics,
        cm:     { rmse: 5.48, mae: 4.38, nis: 0.964, rmseSS: 1.97, tconv: 3213 } as AlgoMetrics,
        tinyml: { rmse: 6.83, mae: 5.25, nis: undefined, rmseSS: 1.93, tconv: 3213 } as AlgoMetrics,
        cmRMean: 130.71, signalRate: 20.45, tinymlR: 63.86,
      },
      black: {
        label: "검정 우드락",
        runs: 3, totalFrames: 694,
        raw:    { rmse: 12.06, mae: 8.64 } as AlgoMetrics,
        fixed:  { rmse: 8.19, mae: 5.96, nis: 0.854, rmseSS: 2.73, tconv: 2940 } as AlgoMetrics,
        cm:     { rmse: 4.77, mae: 3.80, nis: 0.944, rmseSS: 2.82, tconv: 2893 } as AlgoMetrics,
        tinyml: { rmse: 6.12, mae: 4.67, nis: undefined, rmseSS: 2.85, tconv: 3013 } as AlgoMetrics,
        cmRMean: 116.44, signalRate: 11.10, tinymlR: 62.55,
      },
      acryl: {
        label: "투명 아크릴",
        runs: 3, totalFrames: 695,
        raw:    { rmse: 16.14, mae: 12.08 } as AlgoMetrics,
        fixed:  { rmse: 13.77, mae: 10.99, nis: 0.779, rmseSS: 4.41, tconv: 4593 } as AlgoMetrics,
        cm:     { rmse: 13.08, mae: 10.92, nis: 0.934, rmseSS: 6.42, tconv: 2213 } as AlgoMetrics,
        tinyml: { rmse: 12.87, mae: 10.69, nis: undefined, rmseSS: 5.32, tconv: 3533 } as AlgoMetrics,
        cmRMean: 127.27, signalRate: 13.18, tinymlR: 104.22,
        note: "TinyML이 유일하게 Best. 아크릴 고유 반사 패턴이 6-feature 모델에 유리하게 작용한 것으로 추정.",
      },
    },
  },

  // ── E3: ToF 차단 구간 ──────────────────────────────────────────────────
  E3: {
    description: "ToF 차단 구간 — 5 run, 1,152 frames",
    runs: 5,
    totalFrames: 1152,
    raw:    { rmse: 47.46, mae: 26.78 } as AlgoMetrics,
    fixed:  { rmse: 44.94, mae: 25.24, nis: 0.874, rmseSS: 24.54, tconv: 1000 } as AlgoMetrics,
    cm:     { rmse: 14.17, mae: 11.29, nis: 0.935, rmseSS: 17.32, tconv: 1000 } as AlgoMetrics,
    tinyml: { rmse: 16.64, mae: 12.82, nis: undefined, rmseSS: 16.96, tconv: 1080 } as AlgoMetrics,
    // 회복 시간 비교 (그림 5-1 기준)
    recoveryTimeCM_ms: 160,       // 8 frames @ 50Hz
    recoveryTimeTinyML_ms: 60,    // 3 frames @ 50Hz
    recoverySpeedup: 2.67,        // 2.7× faster
  },

  // ── E4: 정적 장기 안정성 ───────────────────────────────────────────────
  E4: {
    description: "500mm 정적 30분 × 3 run — 장기 안정성 및 추론 시간",
    runs: 3,
    totalFrames: 251422,
    raw:    { rmse: 5.14, mae: 4.10 } as AlgoMetrics,
    fixed:  { rmse: 1.87, mae: 1.49, nis: 0.953 } as AlgoMetrics,  // 정적이므로 RMSEss/Tconv 미적용
    cm:     { rmse: 1.86, mae: 1.48, nis: 0.955 } as AlgoMetrics,
    tinyml: { rmse: 1.93, mae: 1.54, nis: undefined } as AlgoMetrics,
    // TinyML 추론 시간
    tinymlInferMean_us: 35.32,
    tinymlInferMax_us: 38.10,
    tinymlInferStd_us: 0.007,
    tinymlInferCount: 242992,
    // 메인 루프 시간
    mainLoopMean_ms: 1.24,
    mainLoopMax_ms: 3.58,
    // R̂ drift
    cmRDriftCV: 0.53,           // % (30분 안정적)
    overrunCount: 0,
    totalLoopCount: 360000,
  },

  // ── E5: 미지 표면 일반화 ───────────────────────────────────────────────
  E5: {
    description: "회색 단면 우드락 미지 표면 — 5 run, 963 frames",
    runs: 5,
    totalFrames: 963,
    raw:    { rmse: 8.40, mae: 6.38 } as AlgoMetrics,
    fixed:  { rmse: 6.18, mae: 4.59, nis: 0.928, rmseSS: 1.36, tconv: 3692 } as AlgoMetrics,
    cm:     { rmse: 5.09, mae: 3.92, nis: 0.961, rmseSS: 1.63, tconv: 3652 } as AlgoMetrics,
    tinyml: { rmse: 5.62, mae: 4.24, nis: undefined, rmseSS: 1.57, tconv: 3664 } as AlgoMetrics,
    run5CmRMax: 489.5,           // mm² anomaly (비정상 피크)
    graySignalRate: 14.98,       // MCps
    note: "E5 표면은 E2 학습 데이터에 없음. TinyML 일반화 성능은 E2 대비 저하 가능성.",
  },

  // ── 실시간 성능 ────────────────────────────────────────────────────────
  realtime: {
    description: "논문 5.2.1 RQ1 — 200Hz 루프 실시간성 검증",
    tinymlBudget_us: 5000,
    tinymlActual_us: 35.32,
    tinymlMarginX: 141.7,         // 14× 마진 (5000/35.32)
    mainLoopBudget_ms: 5,
    mainLoopActual_ms: 1.24,
    mainLoopUsage: 24.8,          // %
    dwtCycles: 90000,
    cpuFreqMHz: 180,
    dwtToMs: 0.5,                 // 90000 cycles @ 180MHz = 0.5ms
    overrunCount: 0,
    totalCycles: 360000,
    note: "실측값은 E4 정적 실험(30분) 기준. 동적 조건에서 달라질 수 있음.",
  },

  // ── Ablation 표 4-10 (논문 4.3.5 확정값) ─────────────────────────────
  TABLE_4_10: {
    title: "표 4-10 Ablation 결과 — TinyML R̂ 라벨 추적도",
    description: "평가: E1 Run 4-5 + E5 전량 (논문 4.3.5)",
    rows: [
      {
        featureSet: "6-feature (메인)",
        features: "tof_dist, residual, residual_var, residual_mean, signal_rate, range_status",
        params: 257,
        tfliteKB: 3.20,
        maeR_f32: 357.31,      // mm²
        mapeR_f32: 34.3,       // %
        maeR_int8: 273.13,     // mm²
        int8DeltaPct: -23.6,   // % (음수 = int8가 더 낮음 — 우연한 이득)
      },
      {
        featureSet: "3-feature (ablation)",
        features: "residual, residual_var, residual_mean",
        params: 209,
        tfliteKB: 3.16,
        maeR_f32: 387.72,      // mm²
        mapeR_f32: 20.1,       // %
        maeR_int8: 393.94,     // mm²
        int8DeltaPct: +1.6,    // % (int8 손실 미미)
      },
    ],
    // 6-feature가 maeR 절댓값은 낮지만 mapeR은 높음 (cm_R 스케일에 의존)
    // 3-feature ablation 시 maeR 8.5% 증가, 파라미터 19% 감소
  },

  // ── 표 5-3 (3-feature hold-out 위치 RMSE, 1차 측정) ─────────────────
  TABLE_5_3: {
    title: "표 5-3 3-feature Ablation Hold-out 위치 RMSE",
    description: "1차 측정 데이터 기준 — GT 산출 오차 영향으로 상대 비교만 유효",
    rows: [
      { scenario: "E2 white run03",  n: 230, fixed: 32.51, cm: 32.99, tinyml3f: 31.77, cmVs3fDiff: -1.22 },
      { scenario: "E2 black run03",  n: 239, fixed: 42.16, cm: 43.54, tinyml3f: 38.63, cmVs3fDiff: -4.91 },
      { scenario: "E2 acryl run03",  n: 236, fixed: 36.85, cm: 32.86, tinyml3f: 97.00, cmVs3fDiff: +64.14, diverged: true },
      { scenario: "E3 run04",        n: 226, fixed: 53.83, cm: 17.47, tinyml3f: 47.17, cmVs3fDiff: +29.70 },
      { scenario: "E3 run05",        n: 234, fixed: 44.80, cm: 18.27, tinyml3f: 30.79, cmVs3fDiff: +12.52 },
    ],
    weightedAvg: { n: 1165, fixed: 42.59, cm: 30.80, tinyml3f: 55.08, cmVs3fDiff: +24.28 },
    // diverged: E2 acryl에서 3-feature 모델이 97mm RMSE로 폭발 → signal_rate 제거의 위험성 입증
    note: "1차 측정 GT는 encoder 기반 역산. 절대값보다 알고리즘 간 상대 비교만 신뢰 가능.",
  },

} as const;
