# Edge AI Kalman Dashboard — Roadmap

## Status Legend

- [x] Done
- [~] In Progress
- [ ] Planned
- [-] Deferred

---

## Phase 0: 프로젝트 정렬

목표: 이전 도메인 흔적 제거, README/제안서 기준 고정.

- [x] 프로젝트명 `Edge AI Kalman Dashboard`로 통일
- [x] README 목적/제한/MVP 범위 정리
- [x] 이전 스타터/학원/정산 도메인 문구 제거
- [x] `.gitignore` 정비 (`.claude/settings.local.json` 제외)
- [x] `.claude/agents/` 커스텀 에이전트 5종 정의

---

## Phase 1: Core Data Pipeline

목표: CSV 업로드 후 분석 가능한 row 배열을 만드는 기반 완성.

- [x] `lib/csv-parser.ts` — 18컬럼 파서 (PapaParse 기반, 헤더 검증)
- [x] `lib/metrics.ts` — RMSE / MAE / NIS pass rate / R RMSE / Tconv 함수
- [x] `lib/store.ts` — Zustand 알고리즘별 CSV 상태 관리
- [x] `lib/dataset.ts` — AlgorithmId / ScenarioLabel 타입, 파일명 파싱
- [x] `lib/ablation-store.ts` — Ablation feature set 슬롯 상태
- [x] `/upload` 페이지 — CSV 업로드 UI, 파일명 검증, 행 수 불일치 경고

---

## Phase 2: MVP Dashboard

목표: E1, E3, Ablation을 시연 가능한 상태로 완성.

- [x] `/dashboard` 페이지 — 시나리오 선택, E1/E3 분기
- [x] `components/views/E1View.tsx` — RMSE/MAE/NIS 메트릭 테이블
- [x] `components/views/E3View.tsx` — 차단 구간 강조, Max Error
- [x] `components/charts/EstimateLineChart.tsx` — KF Estimate vs GT 시계열
- [x] `/ablation` 페이지 — 6-feature / 5-feature / 3-feature 비교

### Phase 2-B: E1 다중 런/알고리즘 재설계 ← 현재 작업

> 배경: 실제 수집 데이터가 알고리즘별 별도 CSV가 아닌
> 런별 단일 CSV (25컬럼, Fixed + CM 동시 포함) 구조로 확정됨.
> 기존 E1View를 실제 데이터 포맷에 맞게 전면 재설계.

#### 데이터 사실 확인 (E1_run01~05.csv)

| 항목 | 확인값 |
|---|---|
| 컬럼 수 | 25개 (shared 12 + fixed 6 + cm 7) |
| 행 수 | 230~236행 per run |
| `gt_distance_mm` | 전부 0.0 → 후처리 복원 필수 |
| 정지구간 비율 | 32~40% (encoder_distance_mm == 0) |
| 샘플링 간격 | ~20ms (50Hz) |
| 전체 실험 시간 | ~5초 per run |

#### 신규 파일

- [x] `lib/e1-csv-parser.ts` — E1Row 타입(25/28컬럼), parseE1CSV(), TinyML 컬럼 감지
- [x] `lib/e1-metrics.ts` — GT 복원 (encoder 기반), Moving phase 트림, CM-R 통계
- [x] `lib/e1-store.ts` — Zustand run별 슬롯 (run1~run5), activeRun, AlgorithmToggle 상태, TrimControl 상태

#### 수정 파일

- [x] `app/upload/page.tsx` — E1 런별 업로드 섹션 추가 (Run1~Run5 슬롯)
- [x] `components/views/E1View.tsx` — 전면 교체 (새 컴포넌트 조합)
- [x] `app/dashboard/page.tsx` — E1 분기 시 새 E1View 연결

#### 신규 컴포넌트

- [x] `components/e1/RunSelector.tsx` — Run1~Run5 탭 + All (업로드된 런만 활성)
- [x] `components/e1/AlgorithmToggle.tsx` — Raw/Fixed/CM/TinyML (TinyML: disabled + "수집 후 활성화" 툴팁)
- [x] `components/e1/TrimControl.tsx` — 정지구간 자동제외 체크박스 + N행 제외 입력 (기본값 0)
- [x] `components/e1/E1MetricCards.tsx` — RMSE / MAE / NIS 95% pass rate / CM-R 평균·범위
- [x] `components/e1/charts/PositionChart.tsx` — GT · Raw · Fixed · CM 위치 시계열
- [x] `components/e1/charts/ResidualChart.tsx` — fixed_residual · cm_residual
- [x] `components/e1/charts/CMRChart.tsx` — cm_R + cm_residual_var 비교
- [x] `components/e1/charts/KalmanGainChart.tsx` — fixed_kalman_gain · cm_kalman_gain

#### GT 복원 공식

```
stop_mask  = rows where encoder_distance_mm == 0
base       = mean(tof_distance_mm[stop_mask])
gt[k]      = base − encoder_distance_mm[k]
```

#### TinyML 확장성 (28컬럼 감지 시 자동 활성)

| 컬럼 | 상태 |
|---|---|
| `r_tinyml` | 있으면 파싱, 없으면 undefined |
| `kf_estimate_tinyml` | 있으면 파싱, 없으면 undefined |
| `tinyml_infer_us` | 있으면 파싱, 없으면 undefined |

- 25컬럼 CSV → TinyML 토글 disabled
- 28컬럼 CSV 감지 → `hasTinyML = true` → TinyML 토글 자동 활성화, PositionChart에 TinyML 라인 추가

#### 구현 순서

1. `lib/e1-csv-parser.ts`
2. `lib/e1-metrics.ts`
3. `lib/e1-store.ts`
4. `app/upload/page.tsx` E1 런 섹션
5. RunSelector / AlgorithmToggle / TrimControl
6. E1MetricCards
7. 4개 차트 컴포넌트
8. `components/views/E1View.tsx` 교체
9. `app/dashboard/page.tsx` 연결
10. `npm run typecheck` + `npm run build` 통과

#### 검증 시나리오

- [x] E1_run01.csv 단독 업로드 → Run1 선택 → GT 복원 확인
- [ ] 정지구간 자동제외 ON/OFF → 메트릭 값 변화 확인
- [ ] TrimTail = 10 → 마지막 10행 제외 후 메트릭 재계산
- [ ] 5개 런 전부 업로드 → All 선택 → 평균 메트릭 확인
- [ ] CM만 토글 → CM 라인만 차트 표시
- [x] 25컬럼 CSV → TinyML 토글 disabled 확인
- [x] `npm run typecheck` + `npm run build` 통과

---

## Phase 3: Optional Scenario Expansion

목표: 시간이 허용될 때 E0/E2/E4/E5 분석 추가.

- [ ] E0 — Python 합성 데이터 2,000 step, Raw 20.04mm vs KF 4.26mm RMSE, NIS 92.6%
- [ ] E2 — 벽 3종(흰/검정 우드락, 투명 아크릴) × 5회 = 15회 그룹 비교
- [ ] E4 — 500mm 정적 30분 × 3회, R_hat drift, 추론 시간
- [ ] E5 — 미지 표면 일반화, E2 교차 분석

---

## Phase 4: Portfolio Polish

목표: 배포와 포트폴리오 설명 완성.

- [ ] Vercel 배포
- [ ] README Deployment 표 갱신 (라이브 URL, Lighthouse 점수)
- [ ] Spec to Implementation 표 실제 경로 검증
- [ ] 발표용 스크린샷 또는 시연 흐름 정리

---

## Phase 5: Optional Research Support

목표: 발표 보조 기능 추가.

- [-] `/method` — 논문 4.3절 지표 설명 페이지
- [-] `/realtime` — 200Hz loop / TinyML <0.5ms / 90,000 cycles 목표 보조 화면
- [-] PNG/SVG export
- [-] Supabase 업로드 이력 저장
- [-] Condition Check (연구 조건 차이 정리 보조 기능, 성능 예측 아님)

---

## 일정

| 날짜 | 목표 |
|---|---|
| 2026-05-30 ~ 현재 | Phase 0~2 완료, E1 재설계 진행 중 |
| 2026-06-02 | E1 재설계 완료 (Phase 2-B), E1/E3/Ablation 시연 가능 상태 |
| 2026-06-05 | Vercel 배포 및 README 정리 (Phase 4) |
| 2026-06-06 ~ 2026-06-09 | 발표 자료에 시연 스크린샷/영상 통합 |
| 2026-06-10 | 졸업 최종 발표 |

---

## 보존 원칙

- `lib/csv-parser.ts` — E3/Ablation용 유지, 변경 금지
- `lib/store.ts` — E3/Ablation용 유지, 변경 금지
- `lib/ablation-store.ts` — 변경 금지
- `app/ablation/page.tsx` — 변경 금지
- `components/views/E3View.tsx` — 변경 금지
- 연구 결과를 새로 주장하거나 예측하는 기능은 만들지 않음
- README/제안서와 논문이 충돌하면 논문 본문 기준 우선
