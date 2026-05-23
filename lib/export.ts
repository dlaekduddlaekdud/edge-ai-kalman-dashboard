/**
 * 분석 결과를 CSV로 다운로드하는 유틸리티.
 * 브라우저의 Blob + URL.createObjectURL 패턴 사용.
 */

import type { E1RunMetrics } from "@/lib/e1-metrics";

/** E1RunMetrics 배열을 CSV 문자열로 직렬화 */
function metricsToCSV(
  runs: Array<{ runLabel: string; metrics: E1RunMetrics }>,
): string {
  const headers = [
    "Run",
    "Raw RMSE (mm)",
    "Raw MAE (mm)",
    "Fixed RMSE (mm)",
    "Fixed MAE (mm)",
    "Fixed NIS (%)",
    "Fixed RMSEss (mm)",
    "Fixed Tconv (ms)",
    "CM RMSE (mm)",
    "CM MAE (mm)",
    "CM NIS (%)",
    "CM RMSEss (mm)",
    "CM Tconv (ms)",
    "CM R Mean (mm²)",
    "TinyML RMSE (mm)",
    "TinyML MAE (mm)",
    "TinyML RMSEss (mm)",
    "TinyML Tconv (ms)",
  ];

  function fmt(v: number | null | undefined): string {
    if (v == null) return "";
    return v.toFixed(3);
  }

  function fmtPct(v: number | null | undefined): string {
    if (v == null) return "";
    return (v * 100).toFixed(1);
  }

  const rows = runs.map(({ runLabel, metrics: m }) => [
    runLabel,
    fmt(m.raw.rmse),
    fmt(m.raw.mae),
    fmt(m.fixed.rmse),
    fmt(m.fixed.mae),
    fmtPct(m.fixed.nisPassRate),
    fmt(m.fixed.rmseSS),
    fmt(m.fixed.tconv),
    fmt(m.cm.rmse),
    fmt(m.cm.mae),
    fmtPct(m.cm.nisPassRate),
    fmt(m.cm.rmseSS),
    fmt(m.cm.tconv),
    fmt(m.cmRMean),
    fmt(m.tinyml?.rmse),
    fmt(m.tinyml?.mae),
    fmt(m.tinyml?.rmseSS),
    fmt(m.tinyml?.tconv),
  ]);

  const lines = [headers, ...rows].map((row) =>
    row.map((cell) => (cell.includes(",") ? `"${cell}"` : cell)).join(","),
  );
  return lines.join("\n");
}

/**
 * E1RunMetrics 배열을 CSV 파일로 브라우저 다운로드.
 *
 * @param runs  - 런 레이블과 메트릭 배열
 * @param filename - 저장 파일명 (확장자 포함)
 */
export function exportMetricsCSV(
  runs: Array<{ runLabel: string; metrics: E1RunMetrics }>,
  filename = "kalman_metrics.csv",
): void {
  const csvContent = metricsToCSV(runs);
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();

  // 정리
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 100);
}
