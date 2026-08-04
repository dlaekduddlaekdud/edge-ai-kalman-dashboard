# Edge AI Kalman Dashboard — Roadmap

- [x] Done · [~] In Progress · [ ] Planned · [-] Deferred

## 원칙

- 연구 결과를 새로 주장하거나 예측하는 기능은 만들지 않음
- README와 논문이 충돌하면 **논문 본문 기준 우선** (최상위 원칙)
- per-frame 원본이 없는 그래프는 임의 생성하지 않고 확정값 카드로 대체

---

## Phase 1: Core Data Pipeline

CSV를 분석 가능한 row 배열로 만드는 기반 구현.

- [x] `lib/csv-parser.ts` — PapaParse 기반 파서, 헤더 검증
- [x] `lib/metrics.ts` — RMSE / MAE / NIS pass rate / Tconv 순수 함수
- [x] `lib/dataset.ts` — AlgorithmId / ScenarioLabel 타입, 파일명 파싱
- [x] `lib/e1-store.ts` — Zustand run 슬롯 상태 관리
- [x] `/upload` — CSV 업로드 UI, 파일명 검증, 행 수 불일치 경고

## Phase 2: Scenario Dashboard

E1 / E3 / Ablation 분석 화면 구현.

- [x] `/dashboard` — 시나리오 선택 및 view 분기
- [x] `components/views/E1View.tsx` — 지표 테이블
- [x] `components/views/E3View.tsx` — 차단 구간 강조, Max Error
- [x] `components/e1/` — RunSelector, AlgorithmToggle, TrimControl, MetricCards
- [x] `components/e1/charts/` — Position, Residual, CM-R, KalmanGain 시계열
- [x] `/ablation` — feature set 비교

### GT 복원 (E1 1차 측정 데이터 대응)

E1 1차 측정 CSV의 `gt_distance_mm`이 전 구간 0으로 기록되어 오차 지표 계산이 불가능했음. 논문 4.1.2절 정의에 따라 ToF 양 끝점을 거리 anchor로 두고, 엔코더는 두 anchor 사이의 진행 비율을 분배하는 보간 변수로만 사용.

```
GT(k) = ToF_start − (enc(k) / enc_last) · (ToF_start − ToF_end)
```

- `ToF_start` / `ToF_end`: 양 끝 5 frame `tof_distance_mm` 평균
- `enc_last < 1 mm` (E4 정적 시나리오): 전체 ToF 평균을 상수 GT로 사용
- 엔코더 단독 누적은 바퀴 슬립으로 실제 이동 거리의 75~94%만 반영하므로 절대 GT로 부적합

| 항목 | 확인값 |
|---|---|
| 행 수 | 230~236 / run |
| 정지 구간 비율 | 32~40% |
| 샘플링 간격 | ~20 ms (50 Hz) |

## Phase 3: 논문 최종본 스키마 동기화

논문 최종본에서 CSV 스키마(18 → 25/28컬럼), 지표 정의(R RMSE 폐기), ablation 슬롯(3 → 2)이 변경되어 전 계층 반영.

- [x] `lib/csv-parser.ts` — 25/28 dual-schema 자동 감지로 전면 교체
- [x] `lib/metrics.ts` — `calculateRRMSE` 삭제, `calculateTconv` 슬라이딩 윈도우 재구현, 지표 5종 추가
- [x] `lib/e1-csv-parser.ts` · `lib/e1-metrics.ts` · `lib/e1-store.ts` — TinyML 컬럼명 정합
- [x] `lib/ablation-store.ts` — 슬롯 3 → 2 (`6f` / `3f`)
- [x] `lib/paper-results.ts` — 논문 확정 수치 상수화 (단일 진실 소스)
- [x] `lib/store.ts` — deprecated 처리 (사용처 0)
- [x] `app/` 전체 — 신 스키마 및 지표 정의 반영
- [x] TinyML NIS는 `innovation_cov` 부재로 계산 불가 → `—` 표시로 통일

## Phase 4: 시나리오 확장 및 지표 정확도

- [x] `components/views/E0View.tsx` — 합성 데이터 결과, NIS 구간 배너
- [x] `components/views/E2View.tsx` — 표면별 그룹 막대 차트
- [x] `components/views/E4View.tsx` — 추론 시간 게이지, R̂ drift CV, 마진 카드
- [x] `components/views/E5View.tsx` — 미지 표면 RMSE, anomaly run 처리
- [x] `components/e1/E1MetricCards.tsx` — RMSEss / Tconv 카드 추가
- [x] `app/realtime/page.tsx` — 실시간 성능 게이지, DWT 사이클 변환
- [x] `app/method/page.tsx` — 필터 파라미터 (NIS 범위, W=20, Tconv 기준, INT8)
- [x] `lib/export.ts` — 지표 CSV 내보내기
- [x] `app/page.tsx` — 핵심 지표 KPI 및 아키텍처 플로우

## Phase 5: 검증 파이프라인

- [x] Vitest 도입 — 지표 함수 12케이스, 파서 스키마 6케이스
- [x] `verify` 스크립트에 `test` 단계 추가 (typecheck → test → build)
- [x] 기존 검증 코드의 CSV 테스트 데이터 오류 수정 (필수 컬럼 누락)
- [ ] `E3View.tsx` 컴포넌트 분리 (608줄)
- [ ] TrimControl ON/OFF 지표 변화 회귀 테스트

## Phase 6: Deployment

- [ ] Vercel 배포
- [ ] README 라이브 URL 갱신
- [ ] 대표 스크린샷 정리

## Deferred

- [-] 분석 이력 영속 저장
- [-] PNG / SVG export
- [-] 실험 조건 비교 보조 기능

---

## 일정

| 날짜 | 목표 |
|---|---|
| 2026-06-02 | E1 재설계 완료, E1/E3/Ablation 시연 가능 |
| 2026-06-10 | 졸업 최종 발표 |
| 2026-08-04 | 단위 테스트 및 검증 파이프라인 구축 |