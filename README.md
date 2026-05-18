# Edge AI Kalman Dashboard

졸업연구의 평가 지표와 실험 시나리오를 웹 대시보드 코드로 옮겨, CSV 기반 분석 과정을 자동화한 프로젝트.

> MVP 구현 완료 (2026-05-18). CSV 업로드 → 시나리오 선택 → RMSE/MAE/NIS 카드 → 라인 차트 흐름이 동작합니다. Vercel 배포 준비 중입니다.

## Getting Started

```bash
git clone https://github.com/dlaekduddlaekdud/edge-ai-kalman-dashboard.git
cd edge-ai-kalman-dashboard
npm install
npm run dev
# http://localhost:3000 접속
```

1. `/upload`에서 실험 CSV를 업로드합니다.
2. `/dashboard`에서 시나리오를 선택하고 메트릭 카드와 차트를 확인합니다.
3. `/ablation`에서 feature set별 RMSE/MAE를 비교합니다.

## Project Overview

**Edge AI Kalman Dashboard**는 졸업연구 "Edge AI 기반 적응형 칼만 필터"의 실험 CSV를 업로드하면, Fixed KF, CM-AKF, TinyML-AKF의 성능을 논문 4.3절 평가 지표 기준으로 비교 분석하도록 설계된 연구 분석 대시보드입니다.

이 프로젝트는 논문 결과를 새로 주장하거나 새로운 실험 성능을 예측하기 위한 앱이 아닙니다. 기존 실험 CSV를 분석하고 시각화하는 포트폴리오용 대시보드로, 졸업연구 분석 과정을 웹 기반으로 정리하는 것이 목적입니다.

## Motivation

이 프로젝트의 1차 목적은 개인 취업 포트폴리오입니다. 웹, 풀스택, SI 직무에서 보여줄 수 있는 데이터 파싱, 지표 계산, 대시보드 시각화, 배포 경험을 하나의 연구 기반 프로젝트로 정리합니다.

2차 목적은 2026년 6월 10일 졸업 최종 발표에서 보조 시연 자료로 활용하는 것입니다. 단, 본 대시보드는 논문 본문에 포함되는 결과물이 아니며, 졸업논문 평가 기준 밖의 포트폴리오 산출물입니다.

## MVP Scope

2026년 6월 5일까지의 1차 MVP 범위는 다음 기능을 우선으로 합니다.

- `/upload`: CSV 18컬럼 파싱 및 검증
- `/dashboard`: 시나리오 셀렉터, 알고리즘 토글, 차트 자동 분기
- `/ablation`: 6-feature, 5-feature, 3-feature 비교
- `lib/metrics.ts`: RMSE, MAE, NIS pass rate, R 추정 RMSE, 수렴 시간 계산
- `lib/csv-parser.ts`: PapaParse 래퍼 및 18컬럼 검증
- E1 정상 baseline 시각화
- E3 차단 구간 강조 시각화
- Ablation 시각화
- README의 Spec → Implementation 표 정리

확장 기능은 시간이 허용될 때 추가합니다.

- E0, E2, E4, E5 차트
- `/realtime`: MCU 측정 결과 비교
- `/method`: 논문 4.3절 수식 및 정당화 페이지
- Supabase 업로드 이력 저장
- PNG/SVG export
- Lighthouse 95+ 목표 점검
- Condition Check

## Demo Flow

계획 중인 기본 사용 흐름은 다음과 같습니다.

1. 사용자가 `/upload`에서 실험 CSV를 업로드합니다.
2. CSV 헤더와 18컬럼 구조를 검증합니다.
3. `/dashboard`에서 시나리오를 선택합니다.
4. Fixed KF, CM-AKF, TinyML-AKF 알고리즘 표시 여부를 토글합니다.
5. 선택된 시나리오에 맞는 메트릭 카드와 차트를 확인합니다.
6. `/ablation`에서 feature set별 성능 차이를 비교합니다.

## Tech Stack

| Area | Stack | Reason |
|---|---|---|
| Framework | Next.js 15, App Router | 기존 스택과의 연속성 |
| Language | TypeScript | 타입 안정성 및 포트폴리오 어필 |
| UI | Tailwind CSS, shadcn/ui | 빠른 셋업과 일관된 디자인 |
| Chart | Recharts | React 친화적이며 ReferenceArea 등 표현 가능 |
| CSV Parsing | PapaParse | 클라이언트 사이드 CSV 파싱 및 헤더 매핑 |
| State | Zustand 또는 Context | 업로드 데이터 전역 공유 |
| Deploy | Vercel | GitHub 기반 자동 배포 |
| Optional DB | Supabase | 업로드 이력 저장 시 사용 |

## Data Format

업로드 대상 CSV는 제안서 기준 18개 컬럼을 사용합니다. 각 row는 TypeScript에서 `KFRow` 형태로 다룰 계획입니다.

| Column | Type | Note |
|---|---|---|
| `timestamp_ms` | `number` | 시간 |
| `tof_distance_mm` | `number` | ToF 거리 |
| `tof_signal_rate` | `number \| null` | E0는 null 가능 |
| `tof_range_status` | `number \| null` | ToF range status |
| `us_distance_mm` | `number \| null` | 초음파 거리 |
| `encoder_distance_mm` | `number` | 엔코더 거리 |
| `encoder_speed_mms` | `number` | 엔코더 속도 |
| `kf_estimate_mm` | `number` | 칼만 필터 추정값 |
| `tof_residual` | `number` | ToF residual |
| `tof_residual_var` | `number \| null` | ToF residual variance, 초기 warm-up row는 null 가능 |
| `tof_residual_mean` | `number \| null` | ToF residual mean, 초기 warm-up row는 null 가능 |
| `sensor_disagree` | `number \| null` | 센서 불일치 지표 |
| `tof_meas_rate` | `number \| null` | ToF measurement rate, 초기 row는 null 가능 |
| `gt_distance_mm` | `number` | Ground truth 거리 |
| `R_label` | `number \| null` | R label, 초기 warm-up row는 null 가능 |
| `kalman_gain` | `number` | Kalman gain |
| `innovation_cov` | `number` | Innovation covariance |
| `scenario_id` | `number \| string` | 시나리오 자동 라우팅에 사용, 예: `E0` |

CSV 파싱은 PapaParse를 사용하고, 업로드 시 헤더 매핑과 컬럼 누락 검증을 수행할 예정입니다. 실제 시뮬레이션 CSV의 초기 warm-up row에서 비어 있는 계산 지표는 `null`로 처리합니다.

## Metrics

논문 4.3.1의 평가 지표를 TypeScript 함수로 옮기는 것을 목표로 합니다.

| Metric | Planned Function | Definition |
|---|---|---|
| RMSE | `calculateRMSE(estimates, gt)` | `sqrt(1/N * sum((x_hat - x_gt)^2))` |
| MAE | `calculateMAE(estimates, gt)` | `1/N * sum(abs(x_hat - x_gt))` |
| NIS pass rate | `calculateNISPassRate(nu, S)` | chi-square, df=1, 95% 양측 구간 `[0.00098, 5.024]` 내 비율 |
| R estimation RMSE | `calculateRRMSE(rEst, rLabel)` | `sqrt(1/N * sum((R_hat - R_label)^2))` |
| Convergence time | `calculateTconv(rmseTS, ssRmse)` | RMSE가 `1.1 * RMSE_ss` 이하가 되는 최초 시점 |

## Spec → Implementation

아직 구현 전이므로 아래 표는 계획 기준입니다. 구현이 진행되면 실제 파일 경로, 함수명, 완료 상태를 검증해 갱신합니다.

| Paper / Proposal Spec | Planned Implementation | Status |
|---|---|---|
| 논문 4.3.1 RMSE | `lib/metrics.ts#calculateRMSE` | Done |
| 논문 4.3.1 MAE | `lib/metrics.ts#calculateMAE` | Done |
| 논문 4.3.1 NIS pass rate | `lib/metrics.ts#calculateNISPassRate` | Done |
| 논문 4.3.1 R 추정 RMSE | `lib/metrics.ts#calculateRRMSE` | Done |
| 논문 4.3.1 수렴 시간 | `lib/metrics.ts#calculateTconv` | Done |
| CSV 18컬럼 파싱 및 검증 | `lib/csv-parser.ts` | Done |
| 전역 상태 관리 (CSV → Dashboard) | `lib/store.ts` (Zustand) | Done |
| E1 정상 baseline 비교 | `components/views/E1View.tsx` | Done |
| E3 차단 구간 강조 | `components/views/E3View.tsx` | Done |
| Ablation feature set 비교 | `app/ablation/page.tsx` | In Progress |

## Scenario Views

| Scenario | Main View | Supporting View | Priority |
|---|---|---|---|
| E0 | 위치 추정 시계열 | NIS 히스토그램, K_ss 수렴 | Optional |
| E1 | RMSE/MAE 비교 막대 | NIS pass rate | MVP |
| E2 | 벽 재질별 RMSE 그룹 막대 | R_hat 시계열 | Optional |
| E3 | 차단 구간 ReferenceArea가 포함된 위치 추정 시계열 | R_hat 시계열, Max Error 표 | MVP |
| E4 | R_hat drift 시계열 | 메인 루프 시간 히스토그램 | Optional |
| E5 | RMSE 비교 및 R_hat 분포 | signal_rate 분포 비교 | Optional |
| Ablation | 6-feature, 5-feature, 3-feature 비교 | TBD | MVP |

## Project Structure

```text
app/
├ page.tsx
├ upload/page.tsx         ← CSV 파싱 및 검증 (완료)
├ dashboard/page.tsx      ← 시나리오 선택, 메트릭 카드, 차트 (완료)
├ ablation/page.tsx       ← feature set 비교 (In Progress)
├ realtime/page.tsx       ← Optional
└ method/page.tsx         ← Optional

lib/
├ csv-parser.ts           ← PapaParse 래퍼, 18컬럼 검증 (완료)
├ metrics.ts              ← RMSE, MAE, NIS, R RMSE, Tconv (완료)
└ store.ts                ← Zustand 전역 상태 (완료)

components/
├ charts/
│  └ EstimateLineChart.tsx  ← KF Estimate vs Ground Truth (완료)
└ views/
   ├ E1View.tsx             ← E1 정상 baseline (완료)
   └ E3View.tsx             ← E3 차단 구간 강조 (완료)
```

## Development Roadmap

| Date | Planned Work | Output |
|---|---|---|
| 2026-05-30 | 프로젝트 셋업, 라우팅, 레이아웃, Tailwind/shadcn | 빈 페이지 4~6개, 사이드바 |
| 2026-05-31 | `lib/metrics.ts`, `lib/csv-parser.ts`, 단위 테스트 | 메트릭 함수 5개, CSV 파서 |
| 2026-06-01 | `/upload`, `/dashboard` 셀렉터, E1View | 첫 시나리오 작동 |
| 2026-06-02 | E3View, `/ablation` | 시연 3종 완성 목표 |
| 2026-06-03 | E0/E2/E4/E5 | 시간 허용 범위 확장 |
| 2026-06-04 | `/realtime`, `/method`, README | 콘텐츠 정리 |
| 2026-06-05 | Vercel 배포, Lighthouse, 디자인 마무리 | 라이브 URL 확보 목표 |
| 2026-06-06 ~ 2026-06-09 | 발표 자료에 시연 영상/스크린샷 통합 | 2026-06-10 발표 준비 |

## Deployment

| Item | Status |
|---|---|
| GitHub Repository | [edge-ai-kalman-dashboard](https://github.com/dlaekduddlaekdud/edge-ai-kalman-dashboard) |
| Vercel Live URL | Coming soon |
| Lighthouse Performance | TBD |
| Deployment Status | TBD |

## Portfolio Notes

이 프로젝트는 다음 역량을 보여주는 포트폴리오 산출물로 정리할 계획입니다.

- 연구 실험 CSV를 웹 애플리케이션 입력 데이터로 변환
- 논문 평가 지표를 TypeScript 함수로 구현
- 시나리오별 분석 요구사항을 대시보드 UI로 구조화
- Recharts 기반 데이터 시각화 구성
- README의 Spec → Implementation 표를 통한 구현 근거 정리
- Vercel 기반 배포 준비 및 GitHub 연동

## Limitations

- 이 대시보드는 새로운 논문 결과를 주장하기 위한 도구가 아닙니다.
- 이 대시보드는 기존 실험 CSV를 분석하고 시각화하는 포트폴리오용 프로젝트입니다.
- 논문 본문에는 포함되지 않으며, 졸업논문 평가 기준 밖의 보조 산출물입니다.
- Condition Check 기능이 추가되더라도 새로운 조건의 성능을 예측하거나 연구 실험 결과로 주장하기 위한 기능이 아닙니다.
- 현재 README는 구현 전 계획 문서이며, 실제 구현 완료 후 파일 경로, 배포 URL, 성능 점수는 갱신되어야 합니다.
