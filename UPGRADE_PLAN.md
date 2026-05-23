# Edge AI Kalman Dashboard — 논문 최종 결과 기반 업그레이드 계획

> **작성 기준**: 논문 최종본(2026-05-23) + PLAN.md + 코드 직접 진단  
> **원칙**: 논문 본문이 1차 기준. ROADMAP 보존 원칙은 이 업그레이드에서 무효화됨.  
> **에이전트 전달 방법**: P0 → P1 → P2 순서로 각 단계만 전달. 한 번에 전체 넘기지 말 것.

---

## ⚠️ ROADMAP 보존 원칙 무효화 선언

ROADMAP.md의 "변경 금지" 원칙은 **이번 업그레이드에서 전면 무효화**된다.  
이유: ROADMAP의 최상위 원칙 자체가 "논문 본문이 충돌 시 논문 기준"이고,  
논문 최종본이 CSV 스키마(18→25/28), 지표 정의(R RMSE 폐기), Ablation 슬롯(3→2)을 변경했기 때문.

변경 금지였던 파일들이 이번 업그레이드에서 변경된다:
- `lib/csv-parser.ts` ← 18컬럼 → 25/28 dual-schema 완전 교체
- `lib/ablation-store.ts` ← 3 슬롯 → 2 슬롯
- `app/ablation/page.tsx` ← 5f 슬롯 제거, 지표 교체
- `components/views/E3View.tsx` ← 구 KFRow → 신 E1Row 기반으로 전환
- `lib/metrics.ts` ← calculateRRMSE 삭제, 신규 함수 추가

---

## 현재 상태 정밀 진단

### ✅ 정상 (논문 기준 충족)

| 파일 | 상태 | 비고 |
|---|---|---|
| `lib/e1-csv-parser.ts` | ⚠️ 부분 | 25/28컬럼 구조 맞음. TinyML 컬럼명만 틀림 |
| `lib/e1-metrics.ts` | ⚠️ 부분 | 기능 맞음. TinyML 컬럼명 참조 오류 |
| `lib/e1-store.ts` | ⚠️ 부분 | 기능 맞음. TinyML 감지 로직 컬럼명 오류 |
| `lib/metrics.ts` | ❌ | calculateRRMSE 존재, Tconv 슬라이딩 미구현 |
| `lib/csv-parser.ts` | ❌ | 18컬럼 구 스키마. 논문 최종 25/28과 충돌 |
| `lib/ablation-store.ts` | ❌ | 3 슬롯(6f/5f/3f). 논문은 2 슬롯(6f/3f) |
| `app/ablation/page.tsx` | ❌ | 5f 슬롯, 구 KFRow 참조, RMSE/MAE 지표 |
| `components/views/E3View.tsx` | ❌ | 구 KFRow(18컬럼) 기반. kf_estimate_mm 참조 |
| `components/e1/E1MetricCards.tsx` | ❌ (추정) | TinyML NIS 항상 "—" 미처리 |

### 🔑 컬럼명 불일치 — 가장 먼저 수정

현재 `lib/e1-csv-parser.ts`의 TinyML 컬럼명이 논문 최종과 다름:

| 현재 코드 | 논문 최종 | 파일 참조 수 |
|---|---|---|
| `r_tinyml` | `tinyml_R` | e1-csv-parser.ts, e1-metrics.ts, e1-store.ts, AlgorithmToggle?, E1MetricCards? |
| `kf_estimate_tinyml` | `tinyml_estimate_mm` | e1-csv-parser.ts, e1-metrics.ts, e1-store.ts |
| `tinyml_infer_us` | `tinyml_infer_us` | ✅ 일치 |

---

## 현재 상태 보완 진단 (2026-05-23 업데이트)

### 확정된 아키텍처 결정

| 항목 | 결정 | 근거 |
|---|---|---|
| E3 CSV 포맷 | **옵션 A — 단일 런 CSV(25/28컬럼)** | 논문 3.6절: 세 알고리즘이 동일 MCU 병렬 동작, CSV는 단일 파일 구조 전제 |
| E2/E4/E5 포맷 | **동일 — 단일 런 CSV** | 4.2절 E2~E5 모두 "N run" 단위 기술, 알고리즘별 분리 언급 없음 |
| useKFStore | **Deprecated** | 알고리즘별 별도 CSV 아키텍처 폐기. E1Store 패턴으로 통일 |
| 표 4-10 수치 | **확정** (논문 4.3.5) | 아래 paper-results.ts 명세에 채움 |
| 표 5-2 수치 | **확정** (논문 5.x) | 아래 paper-results.ts 명세에 채움 |
| 표 5-3 수치 | **확정** (ablation CSV) | 아래 paper-results.ts 명세에 채움 |
| stddev 표시 | **optional — 있으면 ±, 없으면 생략** | E1 raw만 std 제공됨. `std?: number` optional로 정의 |

---

## P0: 논문 정의 충돌 수정 (Day 1-2, 5/24-25 목표)

> 수락 기준: `npm run typecheck` + `npm run build` 통과  
> 커밋: `p0-paper-schema-metrics`

### P0-1. TinyML 컬럼명 전면 교체

**대상 파일**: `lib/e1-csv-parser.ts`, `lib/e1-metrics.ts`, `lib/e1-store.ts`

#### `lib/e1-csv-parser.ts`

```ts
// E1_TINYML_COLUMNS: 현재 → 변경
const E1_TINYML_COLUMNS = ["r_tinyml", "kf_estimate_tinyml", "tinyml_infer_us"];
// → 변경 후
const E1_TINYML_COLUMNS = ["tinyml_estimate_mm", "tinyml_R", "tinyml_infer_us"];
```

`E1Row` 인터페이스 수정:
```ts
// 현재
r_tinyml?: number;
kf_estimate_tinyml?: number;
tinyml_infer_us?: number;

// → 변경 후
tinyml_estimate_mm?: number;
tinyml_R?: number;
tinyml_infer_us?: number;
```

`parseRawRow` 내 파싱 로직도 동일하게 컬럼명 교체:
```ts
// 현재
parsed.r_tinyml = parseRequired(row, "r_tinyml", rowNum);
parsed.kf_estimate_tinyml = parseRequired(row, "kf_estimate_tinyml", rowNum);

// → 변경 후
parsed.tinyml_R = parseRequired(row, "tinyml_R", rowNum);
parsed.tinyml_estimate_mm = parseRequired(row, "tinyml_estimate_mm", rowNum);
```

#### `lib/e1-metrics.ts`

```ts
// 현재
const tinymlRows = trimmed.filter((r) => r.kf_estimate_tinyml !== undefined);
const tinyml =
  tinymlRows.length === trimmed.length
    ? {
        rmse: calculateRMSE(trimmed.map((r) => r.kf_estimate_tinyml!), gt),
        mae: calculateMAE(trimmed.map((r) => r.kf_estimate_tinyml!), gt),
      }
    : undefined;

// → 변경 후
const tinymlRows = trimmed.filter((r) => r.tinyml_estimate_mm !== undefined);
const tinyml =
  tinymlRows.length === trimmed.length
    ? {
        rmse: calculateRMSE(trimmed.map((r) => r.tinyml_estimate_mm!), gt),
        mae: calculateMAE(trimmed.map((r) => r.tinyml_estimate_mm!), gt),
        // NIS: TinyML은 innovation_cov 없음. nisPassRate 필드 없음 (호출 시 "—" 표시)
      }
    : undefined;
```

#### `lib/e1-store.ts`

```ts
// 현재
function detectTinyML(runs: Partial<Record<RunId, E1RunData>>): boolean {
  return Object.values(runs).some(
    (r) => r && r.rows.length > 0 && r.rows[0].kf_estimate_tinyml !== undefined,
  );
}

// → 변경 후
function detectTinyML(runs: Partial<Record<RunId, E1RunData>>): boolean {
  return Object.values(runs).some(
    (r) => r && r.rows.length > 0 && r.rows[0].tinyml_estimate_mm !== undefined,
  );
}
```

---

### P0-1.5. `lib/metrics.ts` — NIS 계산 정확성 검증

P0에서 `calculateNISPassRate`를 그대로 쓰기 전에 논문 정의와 일치하는지 확인한다.

**논문 4.3.1 정의**:
```
ν_k = z_k - H·x̂_{k|k-1}  (업데이트 직전 예측 잔차)
S_k = H·P_{k|k-1}·Hᵀ + R̂_k  (innovation 공분산)
NIS_k = ν_k² / S_k
통과 조건: NIS_k ∈ [0.00098, 5.024]  (chi-square df=1, 95% 양측)
```

**현재 `calculateNISPassRate(nu, S)` 검증 항목**:

```bash
# P0 착수 전 grep 확인
rg "0\.00098|5\.024" lib/metrics.ts   # 정확한 NIS 경계값 사용 여부 → 이미 확인됨 ✅
rg "WARMUP|warm.?up|W=20" lib/metrics.ts  # W=20 warm-up 제외 처리 여부 → ⚠️ metrics.ts 자체엔 없음
```

**결론**: `calculateNISPassRate`는 순수 계산 함수(nu, S 배열 받아 비율 반환). W=20 warm-up 제외는 **호출부 책임**. 검증 항목:

- [x] NIS 경계값 `[0.00098, 5.024]` 정확 — 코드 확인됨
- [ ] `E1MetricCards.tsx`, `e1-metrics.ts`: NIS 계산 시 W=20 이후 rows만 전달하는지 확인
- [ ] `innovation_cov <= 0` 방어 — 현재 `throw RangeError` → **P0에서 `safeNISPassRate` 패턴 유지** (e1-metrics.ts에 이미 구현됨)
- [ ] TinyML 행에서 NIS 계산 자체를 호출하지 않는지 확인 (호출 시 "—")

**P0 수정 사항**: 현재 `calculateNISPassRate` 자체는 올바름. 호출부에서 W=20 slice 누락 여부만 확인하고 필요시 수정.

---

### P0-2. `lib/csv-parser.ts` 25/28 dual-schema 교체

**목표**: 기존 18컬럼 `KFRow`를 폐기하고 논문 3.6절 최종 스키마로 교체.  
**참고**: `lib/e1-csv-parser.ts`가 이미 올바른 25/28 구조 구현 완료. 이를 기반으로 `csv-parser.ts`를 업데이트.

#### 새 `REQUIRED_COLUMNS_25` (1차 측정, 25컬럼)

```ts
// 공통 12
const COMMON_COLUMNS = [
  "seq", "timestamp_ms", "tof_distance_mm", "tof_signal_rate", "tof_range_status",
  "us_distance_mm", "encoder_distance_mm", "encoder_speed_mms", "sensor_disagree",
  "tof_meas_rate", "gt_distance_mm", "scenario_id",
] as const;

// Fixed KF 6
const FIXED_KF_COLUMNS = [
  "fixed_estimate_mm", "fixed_residual", "fixed_residual_var",
  "fixed_residual_mean", "fixed_kalman_gain", "fixed_innovation_cov",
] as const;

// CM-AKF 7
const CM_AKF_COLUMNS = [
  "cm_estimate_mm", "cm_residual", "cm_residual_var", "cm_residual_mean",
  "cm_kalman_gain", "cm_innovation_cov", "cm_R",
] as const;

// TinyML 3 (2차 측정에만 존재)
const TINYML_COLUMNS = [
  "tinyml_estimate_mm", "tinyml_R", "tinyml_infer_us",
] as const;

export const REQUIRED_COLUMNS_25 = [...COMMON_COLUMNS, ...FIXED_KF_COLUMNS, ...CM_AKF_COLUMNS] as const;
// 28컬럼 = 25 + TINYML_COLUMNS
```

#### 새 `KFRow` 타입

```ts
export interface KFRow {
  // 공통 12
  seq: number;
  timestamp_ms: number;
  tof_distance_mm: number;
  tof_signal_rate: number | null;
  tof_range_status: number | null;
  us_distance_mm: number | null;
  encoder_distance_mm: number;
  encoder_speed_mms: number;
  sensor_disagree: number | null;
  tof_meas_rate: number | null;
  gt_distance_mm: number;
  scenario_id: number | `E${number}`;
  // Fixed KF 6
  fixed_estimate_mm: number;
  fixed_residual: number;
  fixed_residual_var: number | null;
  fixed_residual_mean: number | null;
  fixed_kalman_gain: number;
  fixed_innovation_cov: number;
  // CM-AKF 7
  cm_estimate_mm: number;
  cm_residual: number;
  cm_residual_var: number | null;
  cm_residual_mean: number | null;
  cm_kalman_gain: number;
  cm_innovation_cov: number;
  cm_R: number;
  // TinyML 3 (nullable — 1차 측정 CSV에는 없음)
  tinyml_estimate_mm?: number;
  tinyml_R?: number;
  tinyml_infer_us?: number;
}
```

#### 자동 감지 함수

```ts
export function hasTinyMLColumns(headers: string[]): boolean {
  return ["tinyml_estimate_mm", "tinyml_R", "tinyml_infer_us"].every(
    (col) => headers.includes(col)
  );
}
```

#### `parseKFCSV` 동작

- 25컬럼 CSV: TinyML 필드 `undefined` (파싱 안 함)
- 28컬럼 CSV: TinyML 3컬럼 파싱 포함
- 25컬럼 미만 또는 필수 컬럼 누락: RangeError 발생

**주의**: `lib/e1-csv-parser.ts`는 P0 이후에도 유지한다 (E1 전용 `RunId`, `parseRunFromFileName`, 기타 헬퍼 보존). 단, `E1Row`가 새 `KFRow`와 동일 구조가 되므로 `E1Row = KFRow`로 타입 별칭 처리하거나 import 통일.

---

### P0-3. `lib/ablation-store.ts` 슬롯 3→2

```ts
// 현재
export type AblationSetId = "6f" | "5f" | "3f";

// → 변경 후
export type AblationSetId = "6f" | "3f";
```

`clearAll`, `setSlot`, `removeSlot` 구현은 그대로 유지. 타입만 변경.

---

### P0-4. `app/ablation/page.tsx` 업데이트

#### 변경 사항 목록

1. **슬롯 메타 제거**: `"5f"` 항목 완전 제거
2. **그리드 변경**: `md:grid-cols-3` → `md:grid-cols-2`
3. **카운터 변경**: `(filledCount/3)` → `(filledCount/2)`
4. **CSV import 변경**: `parseKFCSV` from `lib/csv-parser` (새 25/28 스키마), `KFRow` 타입
5. **지표 변경**: `RMSE/MAE` → `MAE_R/MAPE_R` (cm_R 라벨 추적도)
6. **표 4-10 하드코딩 카드 추가** (슬롯이 비어도 항상 표시)
7. **`computeMetrics` 재정의**: 위치 RMSE/MAE 대신 cm_R vs tinyml_R 라벨 추적도 계산

#### 새 지표 계산

```ts
interface SlotMetrics {
  maeR: number | null;    // MAE(tinyml_R, cm_R)
  mapeR: number | null;   // MAPE(tinyml_R, cm_R)  = mean(|tinyml_R - cm_R| / cm_R) * 100
  rowCount: number;
}

function computeMetrics(rows: KFRow[]): SlotMetrics {
  const sliced = rows.slice(WARMUP_ROWS);
  if (sliced.length === 0) return { maeR: null, mapeR: null, rowCount: rows.length };

  // tinyml_R이 없으면 null 반환
  const hasTinyml = sliced.every((r) => r.tinyml_R !== undefined);
  if (!hasTinyml) return { maeR: null, mapeR: null, rowCount: rows.length };

  const predR = sliced.map((r) => r.tinyml_R!);
  const labelR = sliced.map((r) => r.cm_R);

  const N = sliced.length;
  const maeR = predR.reduce((s, v, i) => s + Math.abs(v - labelR[i]), 0) / N;
  const mapeR = predR.reduce((s, v, i) => {
    if (labelR[i] === 0) return s;
    return s + Math.abs(v - labelR[i]) / Math.abs(labelR[i]);
  }, 0) / N * 100;

  return { maeR, mapeR, rowCount: rows.length };
}
```

#### 표 4-10 하드코딩 카드 (논문 기준값, 슬롯과 무관하게 항상 표시)

```ts
// lib/paper-results.ts에 위치 (P0에서 생성)
export const TABLE_4_10 = {
  title: "표 4-10 Ablation Study — TinyML R 라벨 추적도",
  description: "평가 기준: E1 Run 4-5 + E5 전량",
  rows: [
    { featureSet: "6-feature", features: "tof_dist, residual, residual_var, residual_mean, signal_rate, range_status", maeR: null, mapeR: null }, // 논문 값 확정 후 채울 것
    { featureSet: "3-feature", features: "residual, residual_var, residual_mean", maeR: null, mapeR: null }, // 논문 값 확정 후 채울 것
  ],
};
// 주의: 논문 표 4-10 실제 수치는 다영이 확인 후 채울 것. 현재는 구조만 잡음.
```

---

### P0-5. `lib/metrics.ts` 업데이트

#### 삭제

```ts
// 완전 삭제
export function calculateRRMSE(rEst, rLabel): number { ... }
```

#### 추가

```ts
/**
 * 논문 4.3.1 기준 RMSEss (steady-state RMSE).
 * 측정 후반 50 frame (1초 @ 50Hz) 기준 RMSE.
 */
export function calculateRMSEss(
  estimates: readonly number[],
  gt: readonly number[],
): number {
  const SS_FRAMES = 50;
  if (estimates.length < SS_FRAMES) {
    // 행이 50개 미만이면 전체로 계산
    return calculateRMSE(estimates, gt);
  }
  const ssEst = estimates.slice(-SS_FRAMES);
  const ssGt = gt.slice(-SS_FRAMES);
  return calculateRMSE(ssEst, ssGt);
}

/**
 * 논문 4.3.1 기준 Tconv (수렴 시간).
 * 직전 50 frame 슬라이딩 윈도우 RMSE가 1.1 × RMSEss 이하로 최초 진입하는 시각(초).
 * 조건 미충족 시 null 반환.
 */
export function calculateTconv(
  estimates: readonly number[],
  gt: readonly number[],
  timestamps: readonly number[], // timestamp_ms
): number | null {
  if (estimates.length < 50) return null;
  const rmse_ss = calculateRMSEss(estimates, gt);
  const threshold = 1.1 * rmse_ss;
  const WINDOW = 50;

  for (let i = WINDOW; i <= estimates.length; i++) {
    const windowEst = estimates.slice(i - WINDOW, i);
    const windowGt = gt.slice(i - WINDOW, i);
    const windowRmse = calculateRMSE(windowEst, windowGt);
    if (windowRmse <= threshold) {
      return timestamps[i - 1] / 1000; // ms → s
    }
  }
  return null;
}

/**
 * E0 전용 Tconv. 절대 임계 ε=5mm 기준.
 * 슬라이딩 윈도우가 아닌 단순 절대 오차 |estimate - gt| <= epsilon 최초 시각.
 */
export function calculateTconvE0(
  estimates: readonly number[],
  gt: readonly number[],
  timestamps: readonly number[],
  epsilon = 5,
): number | null {
  for (let i = 0; i < estimates.length; i++) {
    if (Math.abs(estimates[i] - gt[i]) <= epsilon) {
      return timestamps[i] / 1000;
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
 * CV = std(R) / mean(R). 단위: %.
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
```

**주의**: 기존 `calculateTconv(rmseTS, ssRmse)` 시그니처는 완전히 교체. 기존 호출부 없으면 삭제, 있으면 마이그레이션 필요. (`e1-metrics.ts`에서 사용 여부 확인 필수)

---

### P0-5b. `components/charts/EstimateLineChart.tsx` 업데이트

`EstimateLineChart.tsx:64`에서 `row.kf_estimate_mm` 참조 — 신 KFRow에 해당 컬럼 없음.

```ts
// 현재 (라인 64)
if (point) point[algoId] = row.kf_estimate_mm;

// → 변경 후: 알고리즘별 분기
if (point) {
  switch (algoId) {
    case "raw":    point[algoId] = row.tof_distance_mm; break;
    case "fixed":  point[algoId] = row.fixed_estimate_mm; break;
    case "cm":     point[algoId] = row.cm_estimate_mm; break;
    case "tinyml": point[algoId] = row.tinyml_estimate_mm; break;
  }
}
```

이 컴포넌트는 `AlgorithmData.rows: KFRow[]`를 받으므로 `KFRow`가 새 스키마로 교체되면 타입 에러 발생. 동시에 수정 필요.

---

### P0-6. `components/views/E3View.tsx` 신 스키마 전환

E3View는 현재 구 `KFRow`(18컬럼)의 `kf_estimate_mm` 컬럼을 사용 중.  
논문 최종 25컬럼에는 `kf_estimate_mm`이 없고 `fixed_estimate_mm`, `cm_estimate_mm`으로 분리됨.

**업데이트 내용**:

```ts
// 현재 (구 KFRow 기반)
import { type KFRow } from "@/lib/csv-parser";
// estimates = data.rows.map((r) => r.kf_estimate_mm);  ← 없는 컬럼

// → 변경 후 (신 KFRow 기반, 알고리즘별 분기)
// AlgorithmId별로 올바른 estimate 컬럼 선택
function getEstimates(algoId: AlgorithmId, rows: KFRow[]): number[] {
  switch (algoId) {
    case "raw":    return rows.map((r) => r.tof_distance_mm);
    case "fixed":  return rows.map((r) => r.fixed_estimate_mm);
    case "cm":     return rows.map((r) => r.cm_estimate_mm);
    case "tinyml": return rows.map((r) => r.tinyml_estimate_mm ?? 0);
    default:       return [];
  }
}
```

**차단 구간 탐지 (`detectBlockedIntervals`)**: `tof_range_status`는 공통 컬럼에 있으므로 로직 유지.

**`EstimateLineChart`**: `algorithms` prop의 타입이 신 `KFRow` 기반이므로, `EstimateLineChart`도 신 타입으로 업데이트 필요.

---

### P0-7. TinyML NIS 항상 "—" 보장

**대상**: `components/e1/E1MetricCards.tsx`, E3View 메트릭 테이블, dashboard 메트릭 카드

```ts
// TinyML NIS는 항상 "—"로 표시. 계산 시도 자체 금지.
// 이유: 28컬럼에 tinyml_kalman_gain, tinyml_innovation_cov 없음.
function renderNIS(algoId: AlgorithmId, nisValue: number | undefined): string {
  if (algoId === "tinyml") return "—";
  return nisValue != null ? `${(nisValue * 100).toFixed(1)}%` : "—";
}
```

---

### P0-8. `lib/paper-results.ts` 생성 (전체 확정값 포함)

> **모든 수치는 논문 확정값.** `// TODO` 없이 완성 상태로 생성.  
> stddev는 논문에 기재된 경우만 포함 (`std?: number` optional).  
> 화면에서 std 있으면 "7.36 ± 1.43", 없으면 "7.36" 표시.

```ts
// lib/paper-results.ts
// 논문 확정 수치 단일 진실 소스. P0~P2 모든 View/page가 여기서 import.
// 수치 수정 시 이 파일만 변경하면 전체 반영됨.

/** std optional — 논문에 기재된 경우만 */
interface AlgoMetrics {
  rmse: number;
  rmseStd?: number;
  mae: number;
  maeStd?: number;
  nis?: number;       // pass rate (0~1). TinyML은 항상 null
  rmseSS?: number;    // steady-state RMSE (후반 50 frame)
  tconv?: number;     // ms 단위 수렴 시간
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
    // TinyML이 CM보다 0.53mm 높음 — 미지 표면 일반화 한계
    run5CmRMax: 489.5,           // mm² anomaly (비정상 피크)
    graySignalRate: 14.98,       // MCps (흰 ~15.5보다 낮지만 예상보다 높음)
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
        params: 257,
        tfliteKB: 3.20,
        maeR_f32: 357.31,      // mm²
        mapeR_f32: 34.3,       // %
        maeR_int8: 273.13,     // mm²
        int8DeltaPct: -23.6,   // % (음수 = int8가 더 낮음 — 우연한 이득)
      },
      {
        featureSet: "3-feature (ablation)",
        params: 209,
        tfliteKB: 3.16,
        maeR_f32: 387.72,      // mm²
        mapeR_f32: 20.1,       // %
        maeR_int8: 393.94,     // mm²
        int8DeltaPct: +1.6,    // % (int8 손실 미미)
      },
    ],
    // 해석: 6-feature가 maeR 절댓값은 낮지만 mapeR은 높음 (cm_R 스케일에 의존)
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
```

**stddev 처리 규칙** (UI 구현 시):
```ts
// 공통 헬퍼
function formatMetric(value: number, std?: number, digits = 2): string {
  const base = value.toFixed(digits);
  return std != null ? `${base} ± ${std.toFixed(digits)}` : base;
}
// 예: formatMetric(7.36, 1.43) → "7.36 ± 1.43"
// 예: formatMetric(5.41)       → "5.41"
```

---

### P0-9. `lib/store.ts` (`useKFStore`) Deprecation + E3 아키텍처 E1 패턴으로 통일

**배경**: E3(및 E2/E4/E5) CSV가 단일 런 25/28컬럼 파일로 확정됨에 따라, 알고리즘별 별도 파일 기반 `useKFStore` 아키텍처를 폐기.

**영향 파일**:
- `lib/store.ts` — `useKFStore`, `resolveAlgorithmUpload` 사용처 정리
- `app/upload/page.tsx` — E3 알고리즘 슬롯 섹션을 E1 런 슬롯 방식으로 전환
- `app/dashboard/page.tsx` — E3용 algorithms props 제거
- `components/views/E3View.tsx` — `algorithms: Partial<Record<AlgorithmId, AlgorithmData>>` props 제거 → e1-store 기반으로 전환
- `lib/dataset.ts` — `AlgorithmData`, `SCENARIO_ALGORITHM_SLOTS` 등 KFStore 전용 타입 정리 (단, `AlgorithmId`, `ScenarioLabel` 타입은 유지)

**마이그레이션 방향**:

```ts
// 변경 전: E3View → useKFStore algorithms
// 변경 후: E3View → useE1Store 재사용 (시나리오별 별도 store 불필요)

// 모든 시나리오(E1~E5)가 동일한 "런별 25/28컬럼 CSV" 구조를 사용하므로
// useE1Store + lib/e1-csv-parser.ts + lib/e1-metrics.ts를 공통 인프라로 사용.
//
// 단, 파일명에서 시나리오 구분이 필요하므로 parseScenarioFromFileName 유지.
// 업로드 시 E3_run01.csv → scenario="E3", run=1 로 분류.
```

**`app/upload/page.tsx` 변경 방향**:
- 시나리오 선택 후 "알고리즘 슬롯" 섹션 → "런별 슬롯" 섹션으로 교체
- E1과 동일한 RunSelector UI, 파일명 형식 `E3_run01.csv ~ E3_run05.csv`
- `useKFStore` import 제거

**`lib/store.ts` 처리**: 모든 useKFStore 참조가 제거된 후 파일 삭제 또는 deprecated 주석 추가.

> ⚠️ 이 작업은 P0에서 가장 큰 변경. typecheck 에러 집중 발생 예상. E3View부터 시작.

---

### P0 수락 기준 (typecheck + build 통과 후 커밋)

```bash
npm run typecheck
npm run build
```

확인 목록 (grep 기준, 모두 0이어야 통과):

```bash
# TinyML 구 컬럼명 잔재
rg "r_tinyml|kf_estimate_tinyml" --type ts

# 구 18컬럼 컬럼명 잔재 (csv-parser.ts 교체 후 전체 0)
rg "kf_estimate_mm|R_label\b|\"kalman_gain\"|\"innovation_cov\"" --type ts
# ※ innovation_cov는 신 스키마에 "fixed_innovation_cov"/"cm_innovation_cov"로 변경됨

# 폐기 함수
rg "calculateRRMSE" --type ts

# Ablation 5f 잔재
rg '"5f"' --type ts

# useKFStore 잔재 (store.ts 자체는 deprecated 상태로 남겨도 됨, import 사용처가 0이어야 함)
rg "useKFStore|resolveAlgorithmUpload" --type ts
```

체크리스트:
- [ ] `r_tinyml`, `kf_estimate_tinyml` 잔재 없음
- [ ] `kf_estimate_mm`, `R_label` 잔재 없음 (예외 없음, e1-metrics.ts 포함)
- [ ] `calculateRRMSE` 잔재 없음
- [ ] ablation-store.ts에 `"5f"` 없음
- [ ] ablation/page.tsx에 `md:grid-cols-3` 없음
- [ ] `useKFStore` import 사용처 없음 (store.ts 파일 자체 제외)
- [ ] NIS 계산 시 W=20 warm-up slice 적용 여부 수동 확인
- [ ] TinyML NIS 행이 계산 시도 없이 "—" 반환 확인
- [ ] lib/paper-results.ts 생성 확인 (TABLE_4_10, TABLE_5_2 구조 포함)

---

## P1: 지표 정확도 + TinyML 4-way 활성화 (Day 3, 5/26 목표)

> 수락 기준: 25컬럼 CSV에서 TinyML 비활성, 28컬럼 CSV에서 TinyML 활성, TinyML NIS 항상 "—"  
> 커밋: `p1-metrics-tinyml-4way`

### P1-1. RMSEss / Tconv 대시보드 카드 추가

E1MetricCards에 RMSEss, Tconv 카드 추가:

```tsx
// E1MetricCards.tsx 메트릭 카드 확장
// 기존: RMSE / MAE / NIS / cm_R 평균
// 추가: RMSEss (후반 1초 RMSE) / Tconv (수렴 시간, 초)
```

계산:
- `calculateRMSEss(estimates, gt)` — lib/metrics.ts에서 import
- `calculateTconv(estimates, gt, timestamps)` — lib/metrics.ts에서 import

### P1-2. TinyML 4-way 완전 활성화

`AlgorithmToggle.tsx`:
- 현재: TinyML 버튼 "수집 후 활성화" disabled 상태
- 변경: `hasTinyML === true`이면 enabled, false이면 disabled (동일 로직이지만 hasTinyML이 이제 정확한 컬럼명 기반으로 작동)

`PositionChart.tsx`, `E1MetricCards.tsx`:
- `tinyml_estimate_mm` 컬럼으로 TinyML 라인 추가
- TinyML 색상: `#7c3aed` (보라, e1-store.ts에 이미 정의됨)

### P1-3. E3View TinyML 추가 + R̂ 회복 시계열 (그림 5-1)

E3View에서 알고리즘 4-way 비교:
- Fixed / CM-AKF / TinyML (28컬럼 감지 시 자동)

**그림 5-1 처리 방식**: 동적 그래프 + 카드 fallback 병행

```ts
// E3View 내부 (P0-9 이후 e1-store 기반)
const { runs, hasTinyML } = useE1Store();
const activeRunData = runs[activeRun]; // E3 run03 등
const hasE3TinyML = hasTinyML && activeRunData != null;

// ① 28컬럼 CSV 있을 때: 동적 시계열 그래프
if (hasE3TinyML) {
  // cm_R, tinyml_R 두 라인
  // 차단 진입/이탈 시점 ReferenceLine (blockedIntervals)
  // Y축 상한: Math.min(maxR, 10000) — 폭발 방지 클램프
  // 범례: "CM-AKF R̂", "TinyML R̂"
}

// ② CSV 없거나 25컬럼일 때: 논문 확정 수치 카드
// lib/paper-results.ts → PAPER_RESULTS.E3.recoveryTimeCM_ms/recoveryTimeTinyML_ms
// 카드 내용:
// "차단 이탈 후 R̂ 회복 시간"
// CM-AKF: 160ms (8 frames)  |  TinyML-AKF: 60ms (3 frames)
// "→ TinyML 2.7× 빠른 회복"
```

**차단 구간 탐지 로직** (P0-9 이후 신 KFRow 기반):
- `tof_range_status` 컬럼 우선 (비정상: range_status !== 0)
- fallback: `|tof_distance_mm - gt| / gt > 0.3`
- `gt_distance_mm < 1` 행은 near-zero 오인 방지로 비차단 처리 (기존 로직 유지)

### P1-4. Dashboard 표 5-2 종합 카드

```tsx
// app/dashboard/page.tsx 하단 섹션 추가
// 표 5-2: 모든 시나리오 × 알고리즘 종합 성능표
// 데이터: lib/paper-results.ts에서 import (하드코딩)
// CSV 업로드 유무와 무관하게 항상 표시
```

### P1 수락 기준

- [ ] 25컬럼 CSV 업로드 → TinyML 토글 disabled
- [ ] 28컬럼 CSV 업로드 → TinyML 토글 enabled
- [ ] TinyML NIS 셀 항상 "—" (enabled 상태에서도)
- [ ] E1MetricCards에 RMSEss, Tconv 카드 표시
- [ ] `npm run typecheck` + `npm run build` 통과

---

## P2: 시나리오 확장 + 발표용 페이지 (Day 4-6, 5/27-29 목표)

> 커밋: `p2-scenario-views`  
> 원칙: **논문에 없는 데이터를 꾸며내지 말 것.** per-frame 원본 없는 그래프 → 하드코딩 카드/게이지로 대체.

### P2-1. `components/views/E0View.tsx` 신규

데이터: `lib/paper-results.ts` → `PAPER_RESULTS.E0`  
레이아웃:

```
[개요 카드]
  E0: Python 합성 데이터 2,000 step
  Raw RMSE: 20.04mm → KF RMSE: 4.26mm (78.7% 개선)

[메트릭 카드 2×2]
  P_ss = 19.51 mm²  |  K_ss = 0.049
  NIS pass rate = 95.5%  |  Tconv = 0.120s (24 step, ε=5mm)

[NIS 구간 배너]
  [0.00098, 5.024] chi-square(df=1) 95%

[주석]
  "E0는 Python 합성 시뮬레이션. 실제 센서 없음."
```

per-frame 데이터(시계열)가 없으므로 그래프 꾸미기 금지. 카드 + 배너로 구성.

### P2-2. `components/views/E2View.tsx` 신규

데이터: `PAPER_RESULTS.E2`  
레이아웃:

```
[표면별 RMSE 그룹 막대 차트]
  흰 우드락 / 검정 우드락 / 투명 아크릴
  Raw·Fixed·CM·TinyML 4-way (TinyML은 acryl만 CM 근접 주석)

[표: 표면별 지표]
  표면 | Raw RMSE | Fixed RMSE | cm_R 평균 | signal_rate | TinyML R̂
  흰   | 12.63    | 5.48       | 130.71    | 20.45 MCps  | 63.86
  검정 | 12.06    | 4.77       | 116.44    | 11.10 MCps  | 62.55
  아크릴| 16.14   | 12.87      | 127.27    | 13.18 MCps  | 104.22 ★

[주석]
  아크릴: TinyML R̂ (104.22) ≈ CM R̂ (127.27) 근접, 
  흰/검정보다 높은 오차 (낮은 반사율 기인)
```

### P2-3. `components/views/E4View.tsx` 신규

데이터: `PAPER_RESULTS.E4`  
레이아웃 (2패널):

```
[패널 1: TinyML 추론 시간]
  히스토그램 대신 → 게이지 카드 (bar)
  평균 35.32 µs / 최대 38.10 µs / std 0.007 µs
  5ms 예산 대비: 35.32 / 5000 = 0.71% 사용 (14배 여유)
  242,992 회 측정

[패널 2: 메인 루프 시간]
  평균 1.24 ms / 최대 3.58 ms
  5ms 예산 대비: 1.24 / 5 = 24.8% 사용
  오버런 0 / 360,000

[cm_R 30분 Drift CV]
  CV = 0.53% → 안정적
```

### P2-4. `components/views/E5View.tsx` 신규

데이터: `PAPER_RESULTS.E5`  
레이아웃:

```
[RMSE 카드]
  Raw: 8.40mm → CM: 5.09mm → TinyML: 5.62mm
  (TinyML이 CM보다 0.53mm 높음, 미지 표면 일반화 한계)

[anomaly 강조 박스]
  Run 5: cm_R_max = 489.5 mm² (비정상 피크)

[signal_rate 설명]
  회색 우드락: 14.98 MCps (흰 ~15.5 MCps보다 낮지만 signal_rate 기반 적응 한계 설명)

[한계 주석]
  "E5 표면은 E2 학습 데이터에 없음. TinyML 일반화 성능은 E2 대비 저하 가능성."
```

### P2-5. `app/dashboard/page.tsx` E0/E2/E4/E5 분기 추가

```tsx
// 현재: E1 → E1View, E3 → E3View, 나머지 → EstimateLineChart (기본)
// 변경 후:
{activeScenario === "E1" && <E1View />}
{activeScenario === "E2" && <E2View />}
{activeScenario === "E3" && <E3View ... />}
{activeScenario === "E4" && <E4View />}
{activeScenario === "E5" && <E5View />}
{activeScenario === "E0" && <E0View />}
```

E0/E2/E4/E5는 CSV 없이도 표시 (하드코딩 데이터). E1/E3는 CSV 없으면 업로드 안내.

### P2-6. `app/realtime/page.tsx` 실제 구현

현재 placeholder. 논문 5.2.1 RQ1 기준으로 실제 내용 채움.

```
[페이지 제목]
  실시간 성능 — 논문 5.2.1 RQ1

[TinyML 추론 게이지]
  예산: 5ms (5,000 µs)
  실측: 35.32 µs → 0.71% 사용
  Progress bar: 0.71% 채워진 게이지 (시각적 여유 강조)
  "14× 마진 — 200Hz 루프에서도 안정 동작"

[메인 루프 게이지]
  예산: 5ms
  실측: 1.24ms → 24.8% 사용
  Progress bar

[오버런 카운터]
  0 / 360,000 (0%)

[DWT 사이클 → 시간 변환]
  90,000 cycles @ 180 MHz = 0.5ms

[한계 주석]
  "실측값은 E4 정적 실험(30분) 기준. 동적 주행 조건에서 달라질 수 있음."
```

### P2-7. `app/method/page.tsx` 실제 구현

현재 placeholder. 논문 4.3.1 표 4-5 기준으로 내용 채움.

```
[NIS 범위]
  [0.00098, 5.024] — chi-square(df=1) 95% 양측

[윈도우]
  W = 20 (warm-up 구간 100ms, 50Hz 기준)

[수치 안정화]
  log1p / expm1 사용 이유: R 추정값 폭발 방지

[INT8 bit-exact]
  TinyML 모델 INT8 양자화, STM32F411 MCU

[Spec → Implementation 표]
  논문 정의 | lib 함수 경로
  RMSE      | lib/metrics.ts: calculateRMSE
  MAE       | lib/metrics.ts: calculateMAE
  NIS       | lib/metrics.ts: calculateNISPassRate
  RMSEss    | lib/metrics.ts: calculateRMSEss
  Tconv     | lib/metrics.ts: calculateTconv
  E0 Tconv  | lib/metrics.ts: calculateTconvE0
  R mean    | lib/metrics.ts: calculateRMean
  R drift CV| lib/metrics.ts: calculateRDriftCV
```

### P2-8. Ablation 표 5-3 추가

```tsx
// app/ablation/page.tsx 하단에 추가 섹션
// 표 5-3: 3-feature hold-out 위치 RMSE
// 행: E2 white/black/acryl run03 + E3 run04/05 = 5행
// 데이터: lib/paper-results.ts에 하드코딩 (ablation_holdout_results.csv는 public/results/에 있으면 파싱, 없으면 상수 사용)
```

---

## 파일별 변경 매트릭스 (전체)

| 파일 | Phase | 변경 유형 | 우선순위 |
|---|---|---|---|
| `lib/e1-csv-parser.ts` | P0 | TinyML 컬럼명 교체 (r_tinyml→tinyml_R, kf_estimate_tinyml→tinyml_estimate_mm) | P0 |
| `lib/e1-metrics.ts` | P0 | TinyML 컬럼명 참조 교체 + W=20 warm-up slice 확인 | P0 |
| `lib/e1-store.ts` | P0 | detectTinyML 컬럼명 교체 | P0 |
| `lib/csv-parser.ts` | P0 | 18컬럼 → 25/28 dual-schema 전면 교체 | P0 |
| `lib/metrics.ts` | P0 | calculateRRMSE 삭제, 신규 5개 함수 추가, calculateTconv 재작성 | P0 |
| `lib/ablation-store.ts` | P0 | 슬롯 3→2 (AblationSetId: "6f"\|"5f"\|"3f" → "6f"\|"3f") | P0 |
| `lib/store.ts` | P0 | **Deprecated** — useKFStore import 사용처 제거 후 파일 삭제 | P0 |
| `lib/paper-results.ts` | P0 | **신규 생성** — 전체 확정값 포함 (TABLE_4_10, TABLE_5_2, TABLE_5_3, E0~E5, realtime) | P0 |
| `lib/dataset.ts` | P0 | AlgorithmData/SCENARIO_ALGORITHM_SLOTS 정리 (AlgorithmId/ScenarioLabel은 유지) | P0 |
| `app/upload/page.tsx` | P0 | useKFStore 제거, 알고리즘 슬롯 섹션 → 런 슬롯 방식으로 E3/E2/E4/E5 통일 | P0 |
| `app/ablation/page.tsx` | P0 | 5f 제거, grid-3→2, MAE_R/MAPE_R 지표, 표 4-10 카드 | P0 |
| `components/views/E3View.tsx` | P0 | useKFStore 제거 → e1-store 기반, getEstimates 알고리즘 분기 | P0 |
| `components/charts/EstimateLineChart.tsx` | P0 | kf_estimate_mm → 알고리즘별 분기 (P0-5b) | P0 |
| `components/e1/charts/PositionChart.tsx` | P0 | kf_estimate_tinyml → tinyml_estimate_mm (라인 48-49) | P0 |
| `components/e1/E1MetricCards.tsx` | P0 | TinyML NIS "—" 고정, W=20 warm-up slice 확인 | P0 |
| `app/dashboard/page.tsx` | P0/P1/P2 | useKFStore 제거, E0/E2/E4/E5 분기, 표 5-2 종합 카드 | P0 |
| `components/e1/AlgorithmToggle.tsx` | P1 | TinyML hasTinyML 기반 완전 활성화 | P1 |
| `components/views/E0View.tsx` | P2 | 신규 (P2-1 명세) | P2 |
| `components/views/E2View.tsx` | P2 | 신규 (P2-2 명세) | P2 |
| `components/views/E4View.tsx` | P2 | 신규 (P2-3 명세) | P2 |
| `components/views/E5View.tsx` | P2 | 신규 (P2-4 명세) | P2 |
| `app/realtime/page.tsx` | P2 | placeholder → 실제 구현 (P2-6 명세) | P2 |
| `app/method/page.tsx` | P2 | placeholder → 실제 구현 (P2-7 명세) | P2 |
| `ROADMAP.md` | P0 | 보존 원칙 무효화 선언, Phase 구조 반영 (완료) | P0 |
| `README.md` | P0 | 28컬럼 스키마, calculateRRMSE 삭제 반영 | P0 |

---

## 에이전트 전달 순서 및 지침

### 에이전트에게 전달 시 항상 명시할 것

1. **"이 작업은 논문 최종본(2026-05-23)이 1차 기준"**
2. **"ROADMAP.md 보존 원칙은 이 작업에서 무효화됨"**
3. **"새 연구 결과를 창작하지 말 것. 논문에 없는 수치를 UI에 표시하지 말 것."**
4. **"per-frame 원본 없는 그래프는 하드코딩 카드/게이지로 대체"**

### P0 에이전트 전달 프롬프트

```
이 작업은 UPGRADE_PLAN.md P0 명세를 수행합니다.
논문 최종본(2026-05-23)이 1차 기준. ROADMAP.md 보존 원칙은 무효화됨.
새 연구 결과를 창작하지 말 것. 논문에 없는 수치를 UI에 표시하지 말 것.

P0만 수행하세요. E0/E2/E4/E5 View 신규 생성은 건드리지 마세요.

수행 순서:
1. lib/e1-csv-parser.ts
   - r_tinyml → tinyml_R
   - kf_estimate_tinyml → tinyml_estimate_mm
   - E1_TINYML_COLUMNS 배열 동일하게 교체
   - E1Row 인터페이스 필드명 교체

2. lib/e1-metrics.ts
   - kf_estimate_tinyml 참조 → tinyml_estimate_mm
   - NIS 계산 시 W=20 warm-up slice 적용 여부 확인 (applyTrim 호출 후 trimmed 기반이면 OK)

3. lib/e1-store.ts
   - detectTinyML 내 kf_estimate_tinyml → tinyml_estimate_mm

4. lib/csv-parser.ts
   - 18컬럼 전면 교체 → 25/28 dual-schema (UPGRADE_PLAN.md P0-2 명세 그대로)
   - hasTinyMLColumns 함수 추가
   - KFRow 타입 재정의

5. lib/metrics.ts
   - calculateRRMSE 삭제
   - calculateTconv 슬라이딩 윈도우로 재작성 (UPGRADE_PLAN.md P0-5 명세)
   - calculateRMSEss, calculateTconvE0, calculateRMean, calculateRDriftCV, calculateLabelTracking 추가

6. lib/ablation-store.ts
   - AblationSetId: "6f" | "5f" | "3f" → "6f" | "3f"

7. lib/store.ts
   - Deprecated 처리: 파일 상단에 @deprecated 주석 추가
   - 단, import 사용처부터 제거 후 마지막에 파일 삭제

8. lib/dataset.ts
   - AlgorithmData, SCENARIO_ALGORITHM_SLOTS 정리 (AlgorithmId, ScenarioLabel 타입은 유지)

9. lib/paper-results.ts
   - 신규 생성 (UPGRADE_PLAN.md P0-8 전체 명세 그대로)

10. app/upload/page.tsx
    - useKFStore 제거
    - 알고리즘 슬롯 섹션 → 런 슬롯 방식으로 교체 (E3/E2/E4/E5도 E1과 동일 RunSelector UI)
    - 파일명 형식: E3_run01.csv ~ E3_run05.csv

11. components/charts/EstimateLineChart.tsx
    - kf_estimate_mm → 알고리즘별 분기 (UPGRADE_PLAN.md P0-5b)

12. components/e1/charts/PositionChart.tsx
    - kf_estimate_tinyml → tinyml_estimate_mm (라인 48-49)

13. components/views/E3View.tsx
    - useKFStore algorithms props 제거 → useE1Store 기반으로 전환
    - getEstimates 알고리즘 분기 함수 추가
    - TinyML NIS 항상 "—"

14. components/e1/E1MetricCards.tsx
    - TinyML NIS 항상 "—" 고정

15. app/ablation/page.tsx
    - 5f 슬롯 제거, md:grid-cols-3 → md:grid-cols-2
    - 지표: RMSE/MAE → MAE_R/MAPE_R (cm_R vs tinyml_R 라벨 추적도)
    - 표 4-10 하드코딩 카드 추가 (lib/paper-results.ts 기반)

16. app/dashboard/page.tsx
    - useKFStore 제거
    - E3 분기에서 e1-store 기반 E3View 연결

17. README.md, ROADMAP.md 상태 갱신

완료 후 반드시:
rg "r_tinyml|kf_estimate_tinyml" --type ts    # 0이어야 함
rg "kf_estimate_mm|R_label\b" --type ts       # 0이어야 함
rg "calculateRRMSE" --type ts                  # 0이어야 함
rg '"5f"' --type ts                            # 0이어야 함
rg "useKFStore|resolveAlgorithmUpload" --type ts  # 0이어야 함
npm run typecheck
npm run build
```

### P1 에이전트 전달 프롬프트

```
이 작업은 UPGRADE_PLAN.md P1 명세를 수행합니다. P0 커밋 완료 후 실행.
논문 최종본(2026-05-23)이 1차 기준. 새 수치를 창작하지 말 것.

P1만 수행하세요.

수행 대상:
- components/e1/E1MetricCards.tsx: RMSEss, Tconv 메트릭 카드 추가 (UPGRADE_PLAN.md P1-1)
- components/e1/AlgorithmToggle.tsx: hasTinyML 기반 TinyML 완전 활성화 (P1-2)
- components/e1/charts/PositionChart.tsx: tinyml_estimate_mm 라인 추가, TinyML 보라색 #7c3aed (P1-2)
- components/views/E3View.tsx: cm_R vs tinyml_R 회복 시계열 그래프, 동적+카드 fallback (UPGRADE_PLAN.md P1-3)
- app/dashboard/page.tsx: 표 5-2 종합 카드 추가 (lib/paper-results.ts → TABLE_5_2 기반) (P1-4)

완료 후: npm run typecheck && npm run build 확인 후 커밋.
```

### P2 에이전트 전달 프롬프트

```
이 작업은 UPGRADE_PLAN.md P2 명세를 수행합니다. P1 커밋 완료 후 실행.
논문 최종본(2026-05-23)이 1차 기준.
원칙: 논문에 없는 수치를 창작하지 말 것. per-frame 원본 없으면 하드코딩 카드/게이지로.
모든 표시 수치는 lib/paper-results.ts에서 import.

P2만 수행하세요.

수행 대상:
- components/views/E0View.tsx: 신규 (UPGRADE_PLAN.md P2-1 명세)
- components/views/E2View.tsx: 신규 (UPGRADE_PLAN.md P2-2 명세)
- components/views/E4View.tsx: 신규 (UPGRADE_PLAN.md P2-3 명세)
- components/views/E5View.tsx: 신규 (UPGRADE_PLAN.md P2-4 명세)
- app/dashboard/page.tsx: E0/E2/E4/E5 분기 추가 (UPGRADE_PLAN.md P2-5)
- app/realtime/page.tsx: placeholder → 실제 구현 (UPGRADE_PLAN.md P2-6)
- app/method/page.tsx: placeholder → 실제 구현 (UPGRADE_PLAN.md P2-7)
- app/ablation/page.tsx: 표 5-3 hold-out RMSE 섹션 추가 (UPGRADE_PLAN.md P2-8, lib/paper-results.ts → TABLE_5_3)

완료 후: npm run typecheck && npm run build 확인 후 커밋.
```

---

## ✅ 확정 사항 (2026-05-23 기준 — 모두 결정됨)

| 항목 | 결정 내용 | 반영 위치 |
|---|---|---|
| E3/E2/E4/E5 CSV 포맷 | 단일 런 25/28컬럼 CSV (E1과 동일) | P0-9, upload/page.tsx |
| useKFStore | Deprecated — e1-store 패턴으로 통일 | P0-9 |
| 표 4-10 수치 | 논문 4.3.5 확정값 채움 | P0-8 paper-results.ts |
| 표 5-2 수치 | 논문 확정값 채움 | P0-8 paper-results.ts |
| 표 5-3 수치 | ablation CSV 확정값 채움 | P0-8 paper-results.ts |
| ablation holdout CSV | paper-results.ts 하드코딩으로 충분 (별도 CSV 파싱 불필요) | P0-8 |
| E0 시계열 그래프 | per-frame CSV 없음 → 하드코딩 카드로 구현 | P2-1 |
| stddev 표시 | optional (있으면 ± 표시, 없으면 생략) | P0-8, formatMetric 헬퍼 |
| 그림 5-1 처리 | 동적 그래프 (28컬럼 있으면) + 카드 fallback | P1-3 |
| NIS 정확성 | 계산 함수 자체 OK. 호출부 W=20 slice 확인만 필요 | P0-1.5 |

**남은 미결사항 없음.** P0 착수 가능.

---

## 테스트 계획

### P0 테스트

```bash
# 1. 잔재 확인 (모두 0이어야 통과)
rg "r_tinyml|kf_estimate_tinyml" --type ts
rg "kf_estimate_mm|R_label\b" --type ts
rg "calculateRRMSE" --type ts
rg '"5f"' --type ts
rg "useKFStore|resolveAlgorithmUpload" --type ts

# 2. NIS 경계값 정확성
rg "0\.00098|5\.024" --type ts   # lib/metrics.ts에 있어야 함

# 3. 빌드
npm run typecheck
npm run build

# 4. 수동 확인
- E1 25컬럼 CSV 업로드 → TinyML 토글 disabled 확인
- E1 28컬럼 CSV 업로드 → TinyML 토글 enabled, NIS 셀 "—" 확인
- Ablation 페이지 → 슬롯 2개(6f/3f)만 표시, 표 4-10 카드 확인
- E3 run01.csv 업로드 → 런 슬롯 방식 UI 확인, 차트 정상 표시
- /upload → 시나리오 선택 후 런 슬롯 UI 표시 확인
- lib/paper-results.ts 존재 확인 (TABLE_4_10, E1, E2... 구조)
```

### P1 테스트

```bash
npm run typecheck && npm run build

# 수동 확인
- 28컬럼 CSV → TinyML NIS 셀 "—" 확인
- RMSEss / Tconv 카드 표시 확인
- PositionChart TinyML 보라선 확인
```

### P2 테스트

```bash
npm run typecheck && npm run build

# 수동 확인
- /dashboard → E0 선택 → E0View 카드 표시 (CSV 없이)
- /dashboard → E2 선택 → E2View 표 표시 (CSV 없이)
- /realtime → 게이지 표시
- /method → Spec→Impl 표 표시
- /ablation → 표 5-3 섹션 표시
```

---

## 일정 (2026-05-23 기준)

| 날짜 | 목표 | 커밋 |
|---|---|---|
| 5/24-25 (Day 1-2) | P0 완료 | `p0-paper-schema-metrics` |
| 5/26 (Day 3) | P1 완료 | `p1-metrics-tinyml-4way` |
| 5/27-29 (Day 4-6) | P2 View 완료 | `p2-scenario-views` |
| 5/30-31 (Day 7-8) | Vercel 배포 + Lighthouse + 스크린샷 | `p4-deploy-polish` |
| 6/1-5 | 여유 (논문 변경 반영, polish) | — |
| 6/10 | 졸업 최종 발표 | — |
