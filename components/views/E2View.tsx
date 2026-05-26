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
import { useE1Store, E1_ALGORITHM_COLORS, E1_ALGORITHM_STYLES, type E2Surface } from "@/lib/e1-store";
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
  { key: "acryl",  label: "투명 아크릴", accent: "근소한 TinyML 우세" },
];

interface E2ViewProps {
  showOverview?: boolean;
  showSurfaceSelector?: boolean;
}

export default function E2View({
  showOverview = true,
  showSurfaceSelector = true,
}: E2ViewProps) {
  const { activeE2Surface, setActiveE2Surface } = useE1Store();
  const currentSurface = activeE2Surface ?? "white";
  const sel = E2.surfaces[currentSurface];

  const cmImprovement = (((sel.raw.rmse - sel.cm.rmse) / sel.raw.rmse) * 100).toFixed(1);
  const tinymlVsCm = (sel.tinyml.rmse - sel.cm.rmse).toFixed(2);

  return (
    <div className="space-y-6">
      {/* 개요 */}
      {showOverview && (
        <div className="rounded-lg border border-[#d1d5db] bg-white p-6 shadow-sm">
          <p className="text-xl font-black text-[#111827]">
            E2 — 벽 재질별 반사 특성
          </p>
          <p className="mt-2 text-base leading-7 text-[#4b5563]">{E2.description}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
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
      )}

      {/* ── 표면 선택 + 선택 결과 즉시 표시 ── */}
      <div className="rounded-lg border border-[#d1d5db] bg-white p-6 shadow-sm">
        {showSurfaceSelector && (
          <>
            <p className="mb-4 text-2xl font-black text-[#111827]">
              표면 선택
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {SURFACES.map(({ key, label, accent }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveE2Surface(key)}
                  className={`min-h-[6rem] rounded-lg border px-5 py-4 text-left transition ${
                    currentSurface === key
                      ? "border-[#111827] bg-[#f3f4f6]"
                      : "border-[#d1d5db] bg-white hover:border-[#111827] hover:bg-[#f9fafb]"
                  }`}
                >
                  <p className="text-xl font-black text-[#111827]">
                    {label}
                  </p>
                  {accent && (
                    <p className="mt-1 text-sm font-bold text-[#4b5563]">{accent}</p>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* 선택 표면 RMSE 결과 — 즉시 표시 */}
        <div className={`${showSurfaceSelector ? "mt-6" : ""} grid gap-4 sm:grid-cols-4`}>
          {[
            {
              id: "raw" as const,
              label: "Raw ToF",
              value: `${sel.raw.rmse} mm`,
              sub: `MAE ${sel.raw.mae} mm`,
            },
            {
              id: "fixed" as const,
              label: "Fixed KF",
              value: `${sel.fixed.rmse} mm`,
              sub: `NIS ${sel.fixed.nis != null ? `${(sel.fixed.nis * 100).toFixed(1)}%` : "—"}`,
            },
            {
              id: "cm" as const,
              label: "CM-AKF",
              value: `${sel.cm.rmse} mm`,
              sub: `${cmImprovement}% 개선`,
            },
            {
              id: "tinyml" as const,
              label: "TinyML-AKF",
              value: `${sel.tinyml.rmse} mm`,
              sub: `CM ${Number(tinymlVsCm) > 0 ? `+${tinymlVsCm}` : tinymlVsCm} mm${currentSurface === "acryl" ? " · 근소" : ""}`,
            },
          ].map((card) => (
            <div
              key={card.label}
              className="min-h-[8rem] rounded-lg border p-5"
              style={{
                borderColor: E1_ALGORITHM_STYLES[card.id].border,
                backgroundColor: E1_ALGORITHM_STYLES[card.id].bg,
              }}
            >
              <p className="text-base font-black" style={{ color: E1_ALGORITHM_STYLES[card.id].text }}>{card.label}</p>
              <p className="mt-2 text-3xl font-black tracking-tight" style={{ color: E1_ALGORITHM_STYLES[card.id].text }}>{card.value}</p>
              <p className="mt-2 text-base font-semibold text-[#4b5563]">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* 표면별 해석 */}
        <div className="mt-5 rounded-md bg-[#f8fafc] px-5 py-4 text-lg font-semibold leading-8 text-[#374151]">
          {currentSurface === "white" && "흰 우드락: 높은 signal_rate(~15.5 MCps) — CM-AKF가 TinyML보다 낮은 RMSE. R̂ 단조성 유지 확인."}
          {currentSurface === "black" && "검정 우드락: 낮은 signal_rate(~11 MCps) — CM-AKF 우위. TinyML은 저반사 환경에서 약간 성능 저하."}
          {currentSurface === "acryl" && "투명 아크릴: TinyML-AKF가 CM-AKF보다 근소하게 낮은 RMSE를 보였으나, 차이는 약 0.21 mm로 두 알고리즘은 거의 동등한 수준."}
        </div>

        <div className="mt-3 flex flex-wrap gap-4 text-base font-medium text-[#4b5563]">
          <span>cm_R 평균: {sel.cmRMean} mm²</span>
          <span>Signal Rate: {sel.signalRate} MCps</span>
          <span>TinyML R̂: {sel.tinymlR} mm²</span>
        </div>
      </div>

      {/* 표면별 RMSE 비교 차트 (전체) */}
      <div className="rounded-lg border border-[#d1d5db] bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-black text-[#111827]">반사특성 비교 (표면 3종 RMSE, mm)</h3>
        <p className="mt-1 text-base text-[#6b7280]">논문 확정 수치.</p>
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
        <p className="mt-2 text-xs text-[#4b5563]">
          투명 아크릴: TinyML-AKF({E2.surfaces.acryl.tinyml.rmse}mm)가 CM-AKF({E2.surfaces.acryl.cm.rmse}mm)보다 약 0.21mm 낮아 거의 동등한 수준.
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
                <th className="px-4 py-3 text-right font-semibold" style={{ color: E1_ALGORITHM_COLORS.fixed }}>Fixed KF</th>
                <th className="px-4 py-3 text-right font-semibold" style={{ color: E1_ALGORITHM_COLORS.cm }}>CM-AKF</th>
                <th className="px-4 py-3 text-right font-semibold" style={{ color: E1_ALGORITHM_COLORS.tinyml }}>TinyML</th>
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
                    className={`cursor-pointer transition ${isSelected ? "bg-[#f3f4f6]" : idx % 2 === 1 ? "bg-[#fafafa]" : ""} hover:bg-[#f8fafc]`}
                    onClick={() => setActiveE2Surface(key)}
                  >
                    <td className="px-4 py-3 font-medium text-[#111827]">
                      {surfaceLabel}
                      {key === "acryl" && <span className="ml-1.5 text-xs font-semibold" style={{ color: E1_ALGORITHM_COLORS.tinyml }}>근소한 TinyML 우세</span>}
                      {isSelected && <span className="ml-2 text-xs text-[#111827]">← 선택됨</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-[#475569]">{s.raw.rmse}</td>
                    <td className="px-4 py-3 text-right" style={{ color: E1_ALGORITHM_COLORS.fixed }}>{s.fixed.rmse}</td>
                    <td className="px-4 py-3 text-right font-semibold" style={{ color: E1_ALGORITHM_COLORS.cm }}>{s.cm.rmse}</td>
                    <td className={`px-4 py-3 text-right ${key === "acryl" ? "font-semibold" : ""}`} style={{ color: E1_ALGORITHM_COLORS.tinyml }}>{s.tinyml.rmse}</td>
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
