"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useE1Store, E1_ALGORITHM_COLORS, type E2Surface } from "@/lib/e1-store";
import { PAPER_RESULTS } from "@/lib/paper-results";

const E2 = PAPER_RESULTS.E2;

// 로컬 ALGO_COLORS 제거 — E1_ALGORITHM_COLORS를 단일 진실 소스로 사용
const ALGO_COLORS = E1_ALGORITHM_COLORS;

const barData = [
  {
    surface: "흰 우드락",
    Raw:        E2.surfaces.white.raw.rmse,
    "Fixed KF": E2.surfaces.white.fixed.rmse,
    "CM-AKF":   E2.surfaces.white.cm.rmse,
    "TinyML":   E2.surfaces.white.tinyml.rmse,
  },
  {
    surface: "검정 우드락",
    Raw:        E2.surfaces.black.raw.rmse,
    "Fixed KF": E2.surfaces.black.fixed.rmse,
    "CM-AKF":   E2.surfaces.black.cm.rmse,
    "TinyML":   E2.surfaces.black.tinyml.rmse,
  },
  {
    surface: "투명 아크릴",
    Raw:        E2.surfaces.acryl.raw.rmse,
    "Fixed KF": E2.surfaces.acryl.fixed.rmse,
    "CM-AKF":   E2.surfaces.acryl.cm.rmse,
    "TinyML":   E2.surfaces.acryl.tinyml.rmse,
  },
];

const SURFACES: { key: E2Surface; label: string; accent?: string }[] = [
  { key: "white", label: "흰 우드락" },
  { key: "black", label: "검정 우드락" },
  { key: "acryl",  label: "투명 아크릴", accent: "★ TinyML Best" },
];

export default function E2View() {
  const { activeE2Surface, setActiveE2Surface } = useE1Store();
  const currentSurface = activeE2Surface ?? "white";
  const sel = E2.surfaces[currentSurface];

  const cmImprovement = (((sel.raw.rmse - sel.cm.rmse) / sel.raw.rmse) * 100).toFixed(1);
  const tinymlVsCm = (sel.tinyml.rmse - sel.cm.rmse).toFixed(2);

  return (
    <div className="space-y-6">
      {/* 개요 */}
      <div className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
          E2 — 벽 재질별 반사 특성
        </p>
        <p className="mt-1 text-sm text-[#475569]">{E2.description}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {[
            { label: "흰 우드락",   frames: E2.surfaces.white.totalFrames, runs: E2.surfaces.white.runs },
            { label: "검정 우드락", frames: E2.surfaces.black.totalFrames, runs: E2.surfaces.black.runs },
            { label: "투명 아크릴", frames: E2.surfaces.acryl.totalFrames, runs: E2.surfaces.acryl.runs },
          ].map(({ label, frames, runs }) => (
            <span key={label} className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 text-[#64748b]">
              {label}: {runs}run · {frames}frame
            </span>
          ))}
        </div>
      </div>

      {/* ── 표면 선택 + 선택 결과 즉시 표시 ── */}
      <div className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
          표면 선택
        </p>
        <div className="flex flex-wrap gap-2">
          {SURFACES.map(({ key, label, accent }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveE2Surface(key)}
              className={`rounded-lg border px-4 py-2.5 text-left transition ${
                currentSurface === key
                  ? "border-[#2563eb] bg-[#eff6ff]"
                  : "border-[#d9e0ea] bg-white hover:border-[#94a3b8]"
              }`}
            >
              <p className={`text-sm font-semibold ${currentSurface === key ? "text-[#1d4ed8]" : "text-[#111827]"}`}>
                {label}
              </p>
              {accent && (
                <p className="mt-0.5 text-[11px] font-semibold text-[#f59e0b]">{accent}</p>
              )}
            </button>
          ))}
        </div>

        {/* 선택 표면 RMSE 결과 — 즉시 표시 */}
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-[#d9e0ea] bg-[#f8fafc] p-4">
            <p className="text-xs font-semibold text-[#64748b]">Raw ToF</p>
            <p className="mt-1 text-2xl font-bold text-[#dc2626]">{sel.raw.rmse} mm</p>
            <p className="mt-0.5 text-xs text-[#94a3b8]">MAE {sel.raw.mae} mm</p>
          </div>
          <div className="rounded-lg border border-[#d4d4d8] bg-[#f4f4f5] p-4">
            <p className="text-xs font-semibold text-[#0f766e]">Fixed KF</p>
            <p className="mt-1 text-2xl font-bold text-[#0f766e]">{sel.fixed.rmse} mm</p>
            <p className="mt-0.5 text-xs text-[#5eead4]">
              NIS {sel.fixed.nis != null ? `${(sel.fixed.nis * 100).toFixed(1)}%` : "—"}
            </p>
          </div>
          <div className="rounded-lg border border-[#ede9fe] bg-[#f5f3ff] p-4">
            <p className="text-xs font-semibold text-[#7c3aed]">CM-AKF</p>
            <p className="mt-1 text-2xl font-bold text-[#7c3aed]">{sel.cm.rmse} mm</p>
            <p className="mt-0.5 text-xs text-[#a78bfa]">{cmImprovement}% 개선</p>
          </div>
          <div className={`rounded-lg border p-4 ${currentSurface === "acryl" ? "border-[#fed7aa] bg-[#fff7ed]" : "border-[#fdba74] bg-[#fff7ed]"}`}>
            <p className="text-xs font-semibold text-[#ea580c]">
              TinyML-AKF
              {currentSurface === "acryl" && <span className="ml-1 text-[#f97316]">★</span>}
            </p>
            <p className="mt-1 text-2xl font-bold text-[#ea580c]">
              {sel.tinyml.rmse} mm
            </p>
            <p className="mt-0.5 text-xs text-[#c2410c]">
              CM {Number(tinymlVsCm) > 0 ? `+${tinymlVsCm}` : tinymlVsCm}mm
              {currentSurface === "acryl" && " (Best ★)"}
            </p>
          </div>
        </div>

        {/* 표면별 해석 */}
        <div className="mt-4 rounded-md bg-[#f8fafc] px-4 py-3 text-sm text-[#475569]">
          {currentSurface === "white" && "흰 우드락: 높은 signal_rate(~15.5 MCps) — CM-AKF가 TinyML보다 낮은 RMSE. R̂ 단조성 유지 확인."}
          {currentSurface === "black" && "검정 우드락: 낮은 signal_rate(~11 MCps) — CM-AKF 우위. TinyML은 저반사 환경에서 약간 성능 저하."}
          {currentSurface === "acryl" && "투명 아크릴: 고유 반사 패턴 — TinyML-AKF가 CM-AKF보다 낮은 RMSE. 6-feature 모델이 아크릴 패턴에 유리. 유일한 TinyML Best 케이스."}
        </div>

        <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#64748b]">
          <span>cm_R 평균: {sel.cmRMean} mm²</span>
          <span>Signal Rate: {sel.signalRate} MCps</span>
          <span>TinyML R̂: {sel.tinymlR} mm²</span>
        </div>
      </div>

      {/* 표면별 RMSE 비교 차트 (전체) */}
      <div className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-[#111827]">표면 3종 RMSE 비교 (mm)</h3>
        <p className="mt-0.5 text-xs text-[#94a3b8]">논문 확정 수치.</p>
        <div className="mt-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={barData}
              margin={{ top: 8, right: 24, left: 0, bottom: 4 }}
              barCategoryGap="25%"
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="surface"
                tick={{ fontSize: 13, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 13, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}`}
                label={{
                  value: "RMSE (mm)",
                  angle: -90,
                  position: "insideLeft",
                  offset: 12,
                  style: { fontSize: 13, fill: "#94a3b8" },
                }}
              />
              <Tooltip
                formatter={(v) => [typeof v === "number" ? `${v.toFixed(2)} mm` : v]}
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13 }}
              />
              <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="Raw"      fill={ALGO_COLORS.raw}    radius={[3, 3, 0, 0]} />
              <Bar dataKey="Fixed KF" fill={ALGO_COLORS.fixed}  radius={[3, 3, 0, 0]} />
              <Bar dataKey="CM-AKF"   fill={ALGO_COLORS.cm}     radius={[3, 3, 0, 0]} />
              <Bar dataKey="TinyML"   fill={ALGO_COLORS.tinyml} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-[#f59e0b]">
          ★ 투명 아크릴: TinyML-AKF({E2.surfaces.acryl.tinyml.rmse}mm)가 CM-AKF({E2.surfaces.acryl.cm.rmse}mm)보다 낮음
        </p>
      </div>

      {/* 전체 지표 표 */}
      <div className="rounded-lg border border-[#d9e0ea] bg-white shadow-sm">
        <div className="border-b border-[#f1f5f9] px-6 py-4">
          <h3 className="text-base font-semibold text-[#111827]">표면별 상세 지표</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f8fafc]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#475569]">표면</th>
                <th className="px-4 py-3 text-right font-semibold text-[#475569]">Raw RMSE</th>
                <th className="px-4 py-3 text-right font-semibold text-[#0f766e]">Fixed KF</th>
                <th className="px-4 py-3 text-right font-semibold text-[#7c3aed]">CM-AKF</th>
                <th className="px-4 py-3 text-right font-semibold text-[#ea580c]">TinyML</th>
                <th className="px-4 py-3 text-right font-semibold text-[#475569]">cm_R 평균</th>
                <th className="px-4 py-3 text-right font-semibold text-[#475569]">Signal Rate</th>
                <th className="px-4 py-3 text-right font-semibold text-[#475569]">TinyML R̂</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {(["white", "black", "acryl"] as E2Surface[]).map((key, idx) => {
                const s = E2.surfaces[key];
                const surfaceLabel = key === "white" ? "흰 우드락" : key === "black" ? "검정 우드락" : "투명 아크릴";
                const isSelected = currentSurface === key;
                return (
                  <tr
                    key={key}
                    className={`cursor-pointer transition ${isSelected ? "bg-[#eff6ff]" : idx % 2 === 1 ? "bg-[#fafafa]" : ""} hover:bg-[#f8fafc]`}
                    onClick={() => setActiveE2Surface(key)}
                  >
                    <td className="px-4 py-3 font-medium text-[#111827]">
                      {surfaceLabel}
                      {key === "acryl" && <span className="ml-1.5 text-xs font-normal text-[#f59e0b]">★TinyML Best</span>}
                      {isSelected && <span className="ml-2 text-xs text-[#2563eb]">← 선택됨</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-[#475569]">{s.raw.rmse}</td>
                    <td className="px-4 py-3 text-right text-[#0f766e]">{s.fixed.rmse}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#7c3aed]">{s.cm.rmse}</td>
                    <td className={`px-4 py-3 text-right ${key === "acryl" ? "font-semibold text-[#ea580c]" : "text-[#ea580c]"}`}>{s.tinyml.rmse}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#475569]">{s.cmRMean}</td>
                    <td className="px-4 py-3 text-right font-mono text-[#475569]">{s.signalRate} MCps</td>
                    <td className="px-4 py-3 text-right font-mono text-[#475569]">{s.tinymlR}{key === "acryl" && " ★"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 text-xs text-[#64748b]">
          단위: RMSE(mm), cm_R/TinyML R̂(mm²), Signal Rate(MCps). 표 행 클릭 시 해당 표면 선택.
        </div>
      </div>
    </div>
  );
}
