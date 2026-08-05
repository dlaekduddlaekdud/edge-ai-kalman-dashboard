"use client";

import { useEffect, useState } from "react";
import { PAPER_RESULTS } from "@/lib/paper-results";
import { ALGO_COLORS, algorithmStyles, semanticColors } from "@/lib/palette";
import {
  parseAblationHoldout,
  type AblationHoldoutRow,
  type AblationWeightedAvg,
} from "@/lib/ablation-holdout";

interface AblationHoldoutState {
  loading: boolean;
  rows: AblationHoldoutRow[] | null;
  weightedAvg: AblationWeightedAvg | null;
  source: "csv" | "fallback";
  /** 수치 파싱 실패로 제외된 행 번호. 비어 있지 않으면 화면에 알린다. */
  droppedRows: number[];
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
        <table className="min-w-full divide-y divide-[#e2e8f0] text-base">
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
                  style={{ color: row.int8DeltaPct < 0 ? semanticColors.positive : semanticColors.warning }}
                >
                  {row.int8DeltaPct > 0 ? "+" : ""}{row.int8DeltaPct.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="border-t border-[#f1f5f9] px-6 py-3 text-xs text-[#64748b]">
        MAE_R은 6-feature가 낮지만, MAPE_R은 3-feature가 유리함.
        따라서 6-feature의 절대 우위가 아니라 복합 노이즈 조건에서의 보완적 역할로 해석.
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

      {state.droppedRows.length > 0 && (
        <div className="border-b border-[#fde68a] bg-[#fffbeb] px-6 py-2 text-xs font-semibold text-[#92400e]">
          CSV {state.droppedRows.length}개 행이 수치 파싱 실패로 제외됨 (행 번호: {state.droppedRows.join(", ")}).
          아래 값과 가중 평균은 제외 후 기준입니다.
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#e2e8f0] text-base">
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
                      ⚠ 3f 성능 열화
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
                  style={{ color: row.cmVs3fDiff > 0 ? (row.diverged ? semanticColors.danger : semanticColors.warning) : semanticColors.positive }}
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
              <td className="tabular-nums px-4 py-3 text-right" style={{ color: semanticColors.warning }}>
                {avg.tinyml3f.toFixed(2)}
              </td>
              <td
                className="tabular-nums px-4 py-3 text-right"
                style={{ color: avg.cmVs3fDiff > 0 ? semanticColors.warning : semanticColors.positive }}
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
          {(rows.find((r) => r.scenario.toLowerCase().includes("acryl") && r.scenario.includes("03"))?.tinyml3f?.toFixed(2) ?? "97.00")} mm,
          CM-AKF 대비 +64.14 mm — 상대 성능 열화가 관찰됨.
        </p>
        <p>※ 1차 측정·엔코더 누적 GT 기반 PC 사후추론 결과. 절대값 부풀려짐 — 표 5-2와 직접 비교 금지.</p>
        <p>모델 간 상대 비교(vs CM 열)만 유효.</p>
      </div>
    </div>
  );
}

// ── 메인 페이지 ─────────────────────────────────────────────────────────────

export default function AblationPage() {
  const [holdoutState, setHoldoutState] = useState<AblationHoldoutState>({
    loading: true, rows: null, weightedAvg: null, source: "fallback", droppedRows: [],
  });

  // ablation_holdout_results.csv 동적 로드.
  // 파싱·판정·가중평균은 lib/ablation-holdout.ts에 있다 (단위 테스트 대상).
  useEffect(() => {
    fetch("/data/ablation_holdout_results.csv")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => {
        const { rows, weightedAvg, droppedRows } = parseAblationHoldout(text);
        if (!weightedAvg) {
          // 유효 행이 0이면 가중 평균을 낼 수 없다 → 논문 확정값으로 전환
          setHoldoutState({
            loading: false, rows: null, weightedAvg: null,
            source: "fallback", droppedRows,
          });
          return;
        }
        setHoldoutState({
          loading: false, rows, weightedAvg, source: "csv", droppedRows,
        });
      })
      .catch((err) => {
        // 네트워크 실패와 파싱 실패를 구분할 수 있도록 원인을 남긴다.
        console.error("ablation hold-out CSV 로드 실패:", err);
        setHoldoutState({
          loading: false, rows: null, weightedAvg: null,
          source: "fallback", droppedRows: [],
        });
      });
  }, []);

  return (
    <div className="space-y-8">
      {/* 헤더 */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p
          className="text-base font-bold uppercase tracking-[0.14em]"
          style={{ color: semanticColors.brand }}
        >
          Ablation Study
        </p>
        <h2 className="mt-2 text-3xl font-black text-[#111827]">Feature Set 비교</h2>
        <p className="mt-2 text-base leading-7 text-[#64748b]">
          TinyML-AKF 입력 feature를 6개(메인) / 3개(잔차 통계만)로 줄였을 때의 R 라벨 추적도(MAE_R/MAPE_R)와 위치 RMSE 변화를 비교합니다.
        </p>
      </section>

      {/* R 라벨 추적도 */}
      <section className="space-y-3">
        <div className="border-l-4 pl-4" style={{ borderColor: semanticColors.brand }}>
          <h3 className="text-3xl font-black text-[#111827]">
            R 라벨 추적도 — 6-feature vs 3-feature
          </h3>
          <p className="mt-1 text-base text-[#64748b]">
            MAE_R · MAPE_R · int8 양자화 영향
            <br />
            평가: E2 white/black/acryl run03 + E3 run04-05 (5 run, 1,072 rows) — 논문 표 4-8.
          </p>
        </div>
        <Table4_10Card />
      </section>

      {/* hold-out 위치 RMSE */}
      <section className="space-y-3">
        <div className="border-l-4 pl-4" style={{ borderColor: semanticColors.brand }}>
          <h3 className="text-3xl font-black text-[#111827]">
            3-feature Hold-out 위치 RMSE
          </h3>
          <p className="mt-1 text-base text-[#64748b]">
            1차 측정·엔코더 누적 GT 기반이라 절대값 부풀려짐. 표 5-2와 직접 비교 금지, 모델 간 상대 비교(vs CM 열)만 유효.
          </p>
        </div>
        <div className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-4 py-2 text-sm font-semibold text-[#991b1b]">
          ⚠ E2 아크릴: 3-feature 모델 97.00 mm, CM-AKF 대비 +64.14 mm — 상대 성능 열화.
          CM-AKF 대비 가중 평균 RMSE +24mm 열화. (표 5-2와 절대값 직접 비교 불가)
        </div>
        <Table5_3Card state={holdoutState} />
      </section>

      {/* RQ3 연결 결론 */}
      <section className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-5 py-4">
        <p className="text-xs font-bold uppercase tracking-widest text-[#166534]">RQ3 연결</p>
        <p className="mt-2 text-sm leading-6 text-[#15803d]">
          본 ablation 결과는 잔차 통계 외 feature(F4·F6)의 기여가 <strong>시나리오 의존적</strong>임을 보인다.
          E1·E2 우드락처럼 학습 분포 내 정상 변동에서는 3-feature로도 충분하지만,
          E2 아크릴·E3와 같이 광학적 특이 표면 또는 동적 outlier 환경에서는
          sensor_disagreement, signal_rate 등 multi-modal feature가 안전장치 역할을 할 수 있음을 보여준다{" "}
          <a href="/results#rq3" className="font-semibold underline underline-offset-2">→ RQ3 상세 결과</a>.
        </p>
      </section>
    </div>
  );
}