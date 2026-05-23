# Edge AI Kalman Dashboard

졸업논문 **「Edge AI 기반 적응형 Kalman Filter의 임베디드 실시간 적용 연구」**의 실험 결과를 웹에서 재구성한 Next.js 연구 대시보드입니다. STM32F446RE에서 수집한 25/28컬럼 CSV를 업로드해 Fixed KF, Covariance Matching AKF, TinyML-AKF의 정확도와 실시간성 지표를 논문 정의에 맞춰 확인할 수 있습니다.

> 현재 상태: P0/P1/P2 기능 구현 완료, P3 데이터 신뢰성 개선, P4 UX/표현 정리 완료. 배포는 아직 제외하고 로컬/포트폴리오 문서 기준으로 정리했습니다.

## Quick Start

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

검증은 아래 명령으로 한 번에 실행합니다.

```bash
npm run verify
```

## What This Shows

- 논문 최종 CSV 스키마인 25컬럼(Fixed/CM)과 28컬럼(+TinyML)을 구분해 파싱합니다.
- RMSE, MAE, NIS pass rate, RMSEss, Tconv를 TypeScript 함수로 구현했습니다.
- E1/E3는 업로드 CSV 기반 동적 분석을 제공하고, E0/E2/E4/E5는 논문 확정값 카드/표로 재구성합니다.
- TinyML NIS는 원문처럼 `tinyml_innovation_cov`가 없어 `—`로 표시합니다.
- TinyML 추론 시간은 논문 원문 기준 목표 `0.5 ms = 500 µs`와 비교합니다. 평균 `35.32 µs`는 약 `14.2x` 여유입니다.

## Main Pages

| Route | Purpose | Data Source |
|---|---|---|
| `/` | 프로젝트 개요와 주요 지표 | 논문 확정값 |
| `/upload` | 시나리오/run별 CSV 업로드와 25/28컬럼 표시 | 사용자 CSV |
| `/dashboard` | E0~E5 시나리오별 분석 | E1/E3는 업로드 CSV, 나머지는 논문 확정값 |
| `/ablation` | 6-feature vs 3-feature feature set 비교 | 28컬럼 CSV 또는 논문 표 4-10/5-3 |
| `/realtime` | TinyML 추론 시간과 200Hz 메인 루프 실시간성 | 논문 E4 확정값 |
| `/method` | 지표 정의와 논문 분석 방식 정리 | 논문 방법론 |

## CSV Schema

업로드 파일명은 `{scenario}_runNN.csv` 형식을 권장합니다.

```text
E1_run01.csv
E3_run05.csv
```

### 25-column CSV

Fixed KF와 CM-AKF 분석에 필요한 최종 기본 스키마입니다.

```text
seq,timestamp_ms,tof_distance_mm,tof_signal_rate,tof_range_status,
us_distance_mm,encoder_distance_mm,encoder_speed_mms,sensor_disagree,
tof_meas_rate,gt_distance_mm,scenario_id,
fixed_estimate_mm,fixed_residual,fixed_residual_var,fixed_residual_mean,
fixed_kalman_gain,fixed_innovation_cov,
cm_estimate_mm,cm_residual,cm_residual_var,cm_residual_mean,
cm_kalman_gain,cm_innovation_cov,cm_R
```

### 28-column CSV

25컬럼에 TinyML-AKF 결과 3개 컬럼이 추가됩니다.

```text
tinyml_estimate_mm,tinyml_R,tinyml_infer_us
```

샘플 파일은 `public/sample/E1_run01.csv`(25컬럼)와 `public/sample/E3_run01.csv`(28컬럼)에 있습니다.

## Metrics

| Metric | Implementation | Definition |
|---|---|---|
| RMSE | `lib/metrics.ts#calculateRMSE` | `sqrt(mean((estimate - gt)^2))` |
| MAE | `lib/metrics.ts#calculateMAE` | `mean(abs(estimate - gt))` |
| NIS pass rate | `lib/metrics.ts#calculateNISPassRate` | chi-square df=1, 95% interval `[0.00098, 5.024]` |
| RMSEss | `lib/metrics.ts#calculateRMSEss` | 후반 50 frame 정상상태 RMSE |
| Tconv | `lib/metrics.ts#calculateTconv` | 50 frame sliding RMSE가 `1.1 * RMSEss` 이하로 최초 진입한 시각 |
| E0 Tconv | `lib/metrics.ts#calculateTconvE0` | E0 전용 절대 임계값 `epsilon = 5 mm` |

동적 지표의 ground truth는 논문 원문과 동일하게 CSV의 `gt_distance_mm`를 사용합니다.

## Scenario Coverage

| Scenario | Dashboard Behavior | Notes |
|---|---|---|
| E0 | 논문 확정 카드 | Python 합성 시뮬레이션, CSV 업로드 없음 |
| E1 | 업로드 CSV 기반 동적 차트/카드 | run 선택, algorithm toggle, trim 설정 지원 |
| E2 | 논문 확정 표/막대 차트 | 표면별 RMSE, cm_R, signal rate |
| E3 | 업로드 CSV 기반 차단 구간/R̂ 시계열 | 28컬럼이면 TinyML R̂ 차트 활성화 |
| E4 | 논문 확정 실시간성/장기 안정성 카드 | TinyML 0.5ms 목표와 5ms main loop 분리 |
| E5 | 논문 확정 일반화 카드 | 미지 표면에서 CM/TinyML 비교 |

## Architecture

```text
app/
├ upload/page.tsx       # CSV upload, run/scenario validation
├ dashboard/page.tsx    # Scenario router and source badges
├ ablation/page.tsx     # 6-feature / 3-feature analysis
├ realtime/page.tsx     # MCU timing dashboard
└ method/page.tsx       # Metric definitions and method notes

components/
├ e1/                   # E1/E3 shared controls and charts
└ views/                # E0~E5 scenario views

lib/
├ csv-parser.ts         # Final 25/28-column parser
├ e1-csv-parser.ts      # Run-oriented parser for dashboard upload
├ e1-metrics.ts         # E1/E3 dynamic metric aggregation
├ metrics.ts            # Paper metric functions
├ e1-store.ts           # Zustand store for scenario/run data
└ paper-results.ts      # Single source for thesis-confirmed static values
```

## Portfolio Points

- 연구 논문의 실험 설계를 웹 대시보드 정보 구조로 옮겼습니다.
- 논문 수식과 CSV 스키마를 TypeScript 타입/함수로 구체화했습니다.
- 정적 논문 확정값과 업로드 CSV 기반 동적 계산값을 UI에서 분리했습니다.
- TinyML 실시간성 검증에서 0.5ms 추론 목표와 5ms 제어 루프 예산을 구분했습니다.
- 잘못된 CSV, 시나리오 mismatch, TinyML 컬럼 부재를 사용자에게 명확히 보여주도록 방어했습니다.

## Verification

```bash
npm run typecheck
npm run build
npm run verify
```

현재 CI는 아직 없습니다. 포트폴리오 배포 전에는 GitHub Actions로 `npm run verify`를 연결하는 것을 권장합니다.

## Deployment

배포는 이번 정리 범위에서 제외했습니다. 추후 배포 시에는 Vercel의 Next.js 자동 감지를 사용하고, build command는 `npm run build`를 사용하면 됩니다.

## Limitations

- 이 대시보드는 새 논문 결과를 생성하거나 성능을 예측하지 않습니다.
- E0/E2/E4/E5는 per-frame 원본 CSV 없이 논문 확정값을 시각화합니다.
- TinyML NIS는 원문 CSV에 필요한 TinyML innovation covariance가 없어 계산하지 않습니다.
- Supabase 업로드 이력 저장은 구현하지 않았습니다. 현재 분석 데이터는 브라우저 상태에만 유지됩니다.
