# Data Contract

Edge AI Kalman Dashboard에서 사용하는 CSV 파일 규칙과 알고리즘 데이터 구조 정의.

## 파일명 규칙

```
{scenario}_run{N}_{algorithm}.csv

예시:
  E1_run1_fixed.csv
  E1_run1_cm.csv
  E1_run1_tinyml.csv
  E1_run1_raw.csv
  E0_run1_fixed.csv
```

| 토큰 | 값 | 설명 |
|---|---|---|
| `scenario` | `E0` ~ `E5` | 논문 4.2절 시나리오 ID |
| `N` | 정수 (1~5) | run 번호 |
| `algorithm` | `raw` / `fixed` / `cm` / `tinyml` | 알고리즘 ID |

## 알고리즘 슬롯 정의

| AlgorithmId | 설명 | 비교 대상 |
|---|---|---|
| `raw` | Raw 센서값 (VL53L0X 직접 측정) | `tof_distance_mm` vs `gt_distance_mm` |
| `fixed` | Fixed KF (고정 R) | `kf_estimate_mm` vs `gt_distance_mm` |
| `cm` | CM-AKF (Covariance Matching) | `kf_estimate_mm` vs `gt_distance_mm` |
| `tinyml` | TinyML-AKF (경량 신경망) | `kf_estimate_mm` vs `gt_distance_mm` |

## 시나리오별 슬롯 수

| Scenario | 슬롯 | 이유 |
|---|---|---|
| E0 | `fixed` 1개 | 합성 데이터. tof_signal_rate 등 4개 컬럼 없어 TinyML 학습 불가 |
| E1 ~ E5 | `raw` + `fixed` + `cm` + `tinyml` 4개 | 논문 4종 알고리즘 비교 |

## 샘플 매칭 기준

- 동일 시나리오, 동일 run, 동일 펌웨어 실행 기준으로 4개 알고리즘 CSV의 행 수가 동일해야 함
- 매칭 키: **array index (행 순서)**
- `timestamp_ms`는 참고용이며, 행 수가 다르면 업로드 시 경고 표시
- 자동 정합성 검증은 안 함 — 파일명 규칙으로 사람이 보장

## CSV 컬럼 구조

18컬럼 고정. 논문 3.6절 및 README Data Format 기준.

`raw` 알고리즘 CSV에서 `kf_estimate_mm`은 `tof_distance_mm`과 동일값으로 채워도 됨.
`R_label`은 `raw` / `fixed` 알고리즘 CSV에서 null 허용 (CM-AKF, TinyML-AKF 전용).

## 데이터 분할 전략 (논문 4.4절)

| Scenario | 학습 | 평가 |
|---|---|---|
| E0 | 미사용 | 전량 |
| E1 | Run 1–3 | Run 4–5 |
| E2 | Run 1–3 | Run 4–5 |
| E3 | Run 1–3 | Run 4–5 |
| E4 | 미사용 (전량 평가) | 전량 |
| E5 | 미사용 (전량 평가) | 전량 |
