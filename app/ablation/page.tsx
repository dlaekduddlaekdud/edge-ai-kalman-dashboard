"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";
import { PAPER_RESULTS } from "@/lib/paper-results";
import { ALGO_COLORS, semanticColors } from "@/lib/palette";

// ── 표 5-3 동적 CSV 로드 ────────────────────────────────────────────────

interface AblationHoldoutRow {
  scenario: string;
  n: number;
  fixed: number;
  cm: number;
  tinyml3f: number;
  cmVs3fDiff: number;
  diverged: boolean;
}

interface AblationHoldoutState {
  loading: boolean;
  rows: AblationHoldoutRow[] | null;
  weightedAvg: { n: number; fixed: number; cm: number; tinyml3f: number; cmVs3fDiff: number } | null;
  source: "csv" | "fallback";
}

function formatScenarioName(raw: string): string {
  return raw.replace(/_/g, " ");
}

// ── 표 4-10 ────────────────────────────────────────────────────────────────

function Table4_10Card() {
  const { TABLE_4_10 } = PAPER_RESULTS;
  return (
    <div className="rounded-lg border border-[#d9e0ea] bg-white shadow-sm">
      <div className="border-b border-[#f1f5f9] px-6 py-4">
        <p className="text-xs text-[#94a3b8]">{TABLE_4_10.description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#e2e8f0] text-sm">
          <thead>
            <tr className="bg-[#f8fafc]">
              <th className="px-4 py-3 text-left font-semibold text-[#374151]">Feature Set</th>
              <th className="px-4 py-3 text-right font-semibold text-[#374151]">Params</th>
              <th className="px-4 py-3 text-right font-semibold text-[#374151]">TFLite (KB)</th>
              <th className="px-4 py-3 text-right font-semibold text-[#374151]">MAE_R f32 (mm²)</th>
              <th className="px-4 py-3 text-right font-semibold text-[#374151]">MAPE_R f32 (%)</th>
              <th className="px-4 py-3 text-right font-semibold text-[#374151]">MAE_R int8 (mm²)</th>
              <th className="px-4 py-3 text-right font-semibold text-[#374151]">int8 Δ (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9] bg-white">
            {TABLE_4_10.rows.map((row) => (
              <tr key={row.featureSet} className="hover:bg-[#f8fafc]">
                <td className="px-4 py-3">
                  <p className="font-semibold text-[#111827]">{row.featureSet}</p>
                  <p className="text-xs text-[#94a3b8]">{row.features}</p>
                </td>
                <td className="tabular-nums px-4 py-3 text-right text-[#111827]">{row.params}</td>
                <td className="tabular-nums px-4 py-3 text-right text-[#111827]">{row.tfliteKB.toFixed(2)}</td>
                <td className="tabular-nums px-4 py-3 text-right font-semibold text-[#111827]">{row.maeR_f32.toFixed(2)}</td>
                <td className="tabular-nums px-4 py-3 text-right text-[#111827]">{row.mapeR_f32.toFixed(1)}</td>
                <td className="tabular-nums px-4 py-3 text-right text-[#111827]">{row.maeR_int8.toFixed(2)}</td>
                <td
                  className="tabular-nums px-4 py-3 text-right font-semibold"
                  style={{ color: row.int8DeltaPct < 0 ? semanticColors.positive : semanticColors.danger }}
                >
                  {row.int8DeltaPct > 0 ? "+" : ""}{row.int8DeltaPct.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-[#f1f5f9] px-6 py-3 text-xs text-[#64748b]">
        6-feature: MAE_R 절댓값 낮음, MAPE_R 높음 (cm_R 스케일 의존). 3-feature ablation 시 MAE_R +8.5%, 파라미터 −19%.
      </div>
    </div>
  );
}

// ── 표 5-3 ────────────────────────────────────────────────────────────────

function Table5_3Card({ state }: { state: AblationHoldoutState }) {
  const { TABLE_5_3 } = PAPER_RESULTS;

  const rows: AblationHoldoutRow[] = state.rows ?? TABLE_5_3.rows.map((r) => ({
    scenario: r.scenario,
    n: r.n,
    fixed: r.fixed,
    cm: r.cm,
    tinyml3f: r.tinyml3f,
    cmVs3fDiff: r.cmVs3fDiff,
    diverged: "diverged" in r ? !!r.diverged : false,
  }));

  const avg = state.weightedAvg ?? TABLE_5_3.weightedAvg;

  return (
    <div className="rounded-lg border border-[#d9e0ea] bg-white shadow-sm">
      <div className="flex items-start justify-between border-b border-[#f1f5f9] px-6 py-4">
        <p className="text-xs text-[#94a3b8]">{TABLE_5_3.description}</p>
        <span
          className={`ml-4 shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
            state.loading
              ? "border-[#e2e8f0] bg-[#f8fafc] text-[#94a3b8]"
              : state.source === "csv"
              ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]"
              : "border-[#c7d2fe] bg-[#eef2ff] text-[#1e40af]"
          }`}
        >
          {state.loading ? "로딩 중..." : state.source === "csv" ? "CSV 실측값" : "논문 확정값"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#e2e8f0] text-sm">
          <thead>
            <tr className="bg-[#f8fafc]">
              <th className="px-4 py-3 text-left font-semibold text-[#374151]">시나리오</th>
              <th className="px-4 py-3 text-right font-semibold text-[#374151]">N</th>
              <th className="px-4 py-3 text-right font-semibold" style={{ color: ALGO_COLORS.fixed }}>Fixed KF</th>
              <th className="px-4 py-3 text-right font-semibold" style={{ color: ALGO_COLORS.cm }}>CM-AKF</th>
              <th className="px-4 py-3 text-right font-semibold" style={{ color: ALGO_COLORS.tinyml }}>TinyML 3f</th>
              <th className="px-4 py-3 text-right font-semibold text-[#374151]">CM vs 3f</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9] bg-white">
            {rows.map((row, idx) => (
              <tr
                key={row.scenario}
                className={row.diverged ? "bg-[#fef2f2]" : idx % 2 === 1 ? "bg-[#fafafa]" : ""}
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-[#111827]">{row.scenario}</p>
                  {row.diverged && (
                    <p className="text-xs font-semibold" style={{ color: semanticColors.danger }}>
                      ⚠ 3f 모델 폭발
                    </p>
                  )}
                </td>
                <td className="tabular-nums px-4 py-3 text-right text-[#64748b]">{row.n}</td>
                <td className="tabular-nums px-4 py-3 text-right" style={{ color: ALGO_COLORS.fixed }}>
                  {row.fixed.toFixed(2)}
                </td>
                <td className="tabular-nums px-4 py-3 text-right" style={{ color: ALGO_COLORS.cm }}>
                  {row.cm.toFixed(2)}
                </td>
                <td
                  className="tabular-nums px-4 py-3 text-right"
                  style={{
                    color: row.diverged ? semanticColors.danger : ALGO_COLORS.tinyml,
                    fontWeight: row.diverged ? 700 : 500,
                  }}
                >
                  {row.tinyml3f.toFixed(2)}{row.diverged && " ★"}
                </td>
                <td
                  className="tabular-nums px-4 py-3 text-right font-semibold"
                  style={{ color: row.cmVs3fDiff > 0 ? semanticColors.danger : semanticColors.positive }}
                >
                  {row.cmVs3fDiff > 0 ? "+" : ""}{row.cmVs3fDiff.toFixed(2)}
                </td>
              </tr>
            ))}
            {/* 가중 평균 */}
            <tr className="border-t-2 border-[#d9e0ea] bg-[#f8fafc] font-semibold">
              <td className="px-4 py-3 text-[#111827]">가중 평균 (N={avg.n})</td>
              <td className="tabular-nums px-4 py-3 text-right text-[#64748b]">{avg.n}</td>
              <td className="tabular-nums px-4 py-3 text-right" style={{ color: ALGO_COLORS.fixed }}>
                {avg.fixed.toFixed(2)}
              </td>
              <td className="tabular-nums px-4 py-3 text-right" style={{ color: ALGO_COLORS.cm }}>
                {avg.cm.toFixed(2)}
              </td>
              <td className="tabular-nums px-4 py-3 text-right" style={{ color: semanticColors.danger }}>
                {avg.tinyml3f.toFixed(2)}
              </td>
              <td
                className="tabular-nums px-4 py-3 text-right"
                style={{ color: avg.cmVs3fDiff > 0 ? semanticColors.danger : semanticColors.positive }}
              >
                {avg.cmVs3fDiff > 0 ? "+" : ""}{avg.cmVs3fDiff.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="space-y-1 border-t border-[#f1f5f9] px-6 py-3 text-xs text-[#64748b]">
        <p>단위: mm (위치 RMSE). CM vs 3f: 양수 = 3f가 CM보다 높음 (성능 열화).</p>
        <p>
          ⚠ E2 acryl run03: 3-feature 모델{" "}
          {(rows.find((r) => r.scenario.toLowerCase().includes("acryl") && r.scenario.includes("03"))?.tinyml3f?.toFixed(0) ?? "97")}mm RMSE로 폭발 — signal_rate 제거의 위험성 입증.
        </p>
        <p>{TABLE_5_3.note}</p>
      </div>
    </div>
  );
}

// ── 메인 페이지 ─────────────────────────────────────────────────────────────

export default function AblationPage() {
  const [holdoutState, setHoldoutState] = useState<AblationHoldoutState>({
    loading: true, rows: null, weightedAvg: null, source: "fallback",
  });

  // ablation_holdout_results.csv 동적 로드 (public/data에 존재)
  useEffect(() => {
    fetch("/data/ablation_holdout_results.csv")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        const result = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
        // NaN 방어: parseFloat 결과가 NaN인 row는 제외
        const parsed: AblationHoldoutRow[] = result.data.reduce<AblationHoldoutRow[]>((acc, r) => {
          const fixed = parseFloat(r.rmse_fixed);
          const cm = parseFloat(r.rmse_cm);
          const tinyml3f = parseFloat(r.rmse_3feat);
          const n = parseInt(r.n, 10);
          if (isNaN(fixed) || isNaN(cm) || isNaN(tinyml3f) || isNaN(n)) return acc;
          acc.push({
            scenario: formatScenarioName(r.scenario),
            n,
            fixed,
            cm,
            tinyml3f,
            cmVs3fDiff: tinyml3f - cm,
            diverged: tinyml3f > 50 || tinyml3f > cm * 2,
          });
          return acc;
        }, []);

        const totalN = parsed.reduce((s, r) => s + r.n, 0);
        // totalN이 0이면 가중 평균 계산 불가 → fallback으로 전환
        if (totalN === 0) {
          setHoldoutState({ loading: false, rows: null, weightedAvg: null, source: "fallback" });
          return;
        }
        const wavg = (getter: (r: AblationHoldoutRow) => number) =>
          parsed.reduce((s, r) => s + getter(r) * r.n, 0) / totalN;

        setHoldoutState({
          loading: false,
          rows: parsed,
          weightedAvg: {
            n: totalN,
            fixed: wavg((r) => r.fixed),
            cm: wavg((r) => r.cm),
            tinyml3f: wavg((r) => r.tinyml3f),
            cmVs3fDiff: wavg((r) => r.cmVs3fDiff),
          },
          source: "csv",
        });
      })
      .catch(() => {
        setHoldoutState({ loading: false, rows: null, weightedAvg: null, source: "fallback" });
      });
  }, []);

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p
          className="text-xs font-semibold uppercase tracking-[0.14em]"
          style={{ color: semanticColors.brand }}
        >
          Ablation Study
        </p>
        <h2 className="mt-2 text-2xl font-bold text-[#111827]">Feature Set 비교</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748b]">
          TinyML-AKF 입력 feature를 6개(메인) / 3개(잔차 통계만)로 줄였을 때의
          R 라벨 추적도(MAE_R/MAPE_R)와 위치 RMSE 변화를 비교합니다.
        </p>
        <div
          className="mt-4 rounded-md border px-4 py-2.5 text-xs font-semibold"
          style={{ borderColor: "#c7d2fe", backgroundColor: "#eef2ff", color: semanticColors.brand }}
        >
          W=20 warm-up 제외 · MAE_R = mean(|tinyml_R − cm_R|) · MAPE_R = mean(|tinyml_R − cm_R| / cm_R) × 100
        </div>
      </section>

      {/* 표 4-10 — R 라벨 추적도 */}
      <section className="space-y-3">
        <div className="border-l-4 pl-4" style={{ borderColor: ALGO_COLORS.tinyml }}>
          <p
            className="text-xs font-semibold uppercase tracking-[0.12em]"
            style={{ color: ALGO_COLORS.tinyml }}
          >
            표 4-10
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#111827]">
            R 라벨 추적도 — 6-feature vs 3-feature
          </h3>
          <p className="mt-1 text-sm text-[#64748b]">
            MAE_R · MAPE_R · int8 양자화 영향. 평가: E1 Run4-5 + E5 전량.
          </p>
        </div>
        <div
          className="rounded-md border px-4 py-2 text-xs font-semibold"
          style={{ borderColor: "#fde68a", backgroundColor: "#fffbeb", color: ALGO_COLORS.tinyml }}
        >
          6-feature: tof_dist, residual, residual_var, residual_mean, signal_rate, range_status |
          3-feature: residual, residual_var, residual_mean
        </div>
        <Table4_10Card />
      </section>

      {/* 표 5-3 — hold-out 위치 RMSE */}
      <section className="space-y-3">
        <div className="border-l-4 pl-4" style={{ borderColor: semanticColors.danger }}>
          <p
            className="text-xs font-semibold uppercase tracking-[0.12em]"
            style={{ color: semanticColors.danger }}
          >
            표 5-3
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[#111827]">
            3-feature Hold-out 위치 RMSE
          </h3>
          <p className="mt-1 text-sm text-[#64748b]">
            1차 측정 데이터 기준 — GT 산출 오차 영향으로 상대 비교만 유효.
          </p>
        </div>
        <div className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-4 py-2 text-xs font-semibold text-[#991b1b]">
          ⚠ E2 아크릴: 3-feature 모델 97mm RMSE 폭발 — signal_rate 제거 시 고반사 표면에서 위험.
          CM-AKF 대비 가중 평균 RMSE +24mm 열화.
        </div>
        <Table5_3Card state={holdoutState} />
      </section>
    </div>
  );
}
