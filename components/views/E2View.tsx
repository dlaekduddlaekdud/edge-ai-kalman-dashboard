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
import { PAPER_RESULTS } from "@/lib/paper-results";

const E2 = PAPER_RESULTS.E2;

// 알고리즘 색상 — E1_ALGORITHM_COLORS와 일치
const ALGO_COLORS = {
  raw:    "#64748b",
  fixed:  "#10b981",
  cm:     "#2563eb",
  tinyml: "#7c3aed",
};

// 표면별 그룹 막대 데이터
const barData = [
  {
    surface: "흰 우드락",
    Raw:    E2.surfaces.white.raw.rmse,
    "Fixed KF": E2.surfaces.white.fixed.rmse,
    "CM-AKF":   E2.surfaces.white.cm.rmse,
    "TinyML":   E2.surfaces.white.tinyml.rmse,
  },
  {
    surface: "검정 우드락",
    Raw:    E2.surfaces.black.raw.rmse,
    "Fixed KF": E2.surfaces.black.fixed.rmse,
    "CM-AKF":   E2.surfaces.black.cm.rmse,
    "TinyML":   E2.surfaces.black.tinyml.rmse,
  },
  {
    surface: "투명 아크릴",
    Raw:    E2.surfaces.acryl.raw.rmse,
    "Fixed KF": E2.surfaces.acryl.fixed.rmse,
    "CM-AKF":   E2.surfaces.acryl.cm.rmse,
    "TinyML":   E2.surfaces.acryl.tinyml.rmse,
  },
];

export default function E2View() {
  return (
    <div className="space-y-6">
      {/* 개요 카드 */}
      <div className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
          E2 — 벽 재질별 반사 특성
        </p>
        <p className="mt-1 text-sm text-[#475569]">
          {E2.description}
        </p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          {[
            { label: "흰 우드락", frames: E2.surfaces.white.totalFrames, runs: E2.surfaces.white.runs },
            { label: "검정 우드락", frames: E2.surfaces.black.totalFrames, runs: E2.surfaces.black.runs },
            { label: "투명 아크릴", frames: E2.surfaces.acryl.totalFrames, runs: E2.surfaces.acryl.runs },
          ].map(({ label, frames, runs }) => (
            <span key={label} className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 text-[#64748b]">
              {label}: {runs}run · {frames}frame
            </span>
          ))}
        </div>
      </div>

      {/* 표면별 RMSE 그룹 막대 차트 */}
      <div className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-[#111827]">표면별 RMSE 비교 (mm)</h3>
        <p className="mt-0.5 text-xs text-[#94a3b8]">
          논문 확정 수치. per-frame 원본 없는 시계열 차트는 표로 대체합니다.
        </p>
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
                tick={{ fontSize: 12, fill: "#64748b" }}
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
                contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 12 }}
              />
              <Legend verticalAlign="top" height={32} />
              <Bar dataKey="Raw"      fill={ALGO_COLORS.raw}    radius={[3, 3, 0, 0]} />
              <Bar dataKey="Fixed KF" fill={ALGO_COLORS.fixed}  radius={[3, 3, 0, 0]} />
              <Bar dataKey="CM-AKF"   fill={ALGO_COLORS.cm}     radius={[3, 3, 0, 0]} />
              <Bar dataKey="TinyML"   fill={ALGO_COLORS.tinyml} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-xs text-[#f59e0b]">
          ★ 투명 아크릴: TinyML-AKF({E2.surfaces.acryl.tinyml.rmse}mm)가 CM-AKF({E2.surfaces.acryl.cm.rmse}mm)보다 낮음 — 유일한 TinyML Best 케이스
        </p>
      </div>

      {/* 표면별 상세 지표 */}
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
                <th className="px-4 py-3 text-right font-semibold text-[#10b981]">Fixed KF</th>
                <th className="px-4 py-3 text-right font-semibold text-[#2563eb]">CM-AKF</th>
                <th className="px-4 py-3 text-right font-semibold text-[#7c3aed]">TinyML</th>
                <th className="px-4 py-3 text-right font-semibold text-[#475569]">cm_R 평균</th>
                <th className="px-4 py-3 text-right font-semibold text-[#475569]">Signal Rate</th>
                <th className="px-4 py-3 text-right font-semibold text-[#475569]">TinyML R̂</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {/* 흰 우드락 */}
              <tr>
                <td className="px-4 py-3 font-medium text-[#111827]">흰 우드락</td>
                <td className="px-4 py-3 text-right text-[#475569]">{E2.surfaces.white.raw.rmse}</td>
                <td className="px-4 py-3 text-right text-[#10b981]">{E2.surfaces.white.fixed.rmse}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#2563eb]">{E2.surfaces.white.cm.rmse}</td>
                <td className="px-4 py-3 text-right text-[#7c3aed]">{E2.surfaces.white.tinyml.rmse}</td>
                <td className="px-4 py-3 text-right font-mono text-[#475569]">{E2.surfaces.white.cmRMean}</td>
                <td className="px-4 py-3 text-right font-mono text-[#475569]">{E2.surfaces.white.signalRate} MCps</td>
                <td className="px-4 py-3 text-right font-mono text-[#475569]">{E2.surfaces.white.tinymlR}</td>
              </tr>
              {/* 검정 우드락 */}
              <tr className="bg-[#fafafa]">
                <td className="px-4 py-3 font-medium text-[#111827]">검정 우드락</td>
                <td className="px-4 py-3 text-right text-[#475569]">{E2.surfaces.black.raw.rmse}</td>
                <td className="px-4 py-3 text-right text-[#10b981]">{E2.surfaces.black.fixed.rmse}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#2563eb]">{E2.surfaces.black.cm.rmse}</td>
                <td className="px-4 py-3 text-right text-[#7c3aed]">{E2.surfaces.black.tinyml.rmse}</td>
                <td className="px-4 py-3 text-right font-mono text-[#475569]">{E2.surfaces.black.cmRMean}</td>
                <td className="px-4 py-3 text-right font-mono text-[#475569]">{E2.surfaces.black.signalRate} MCps</td>
                <td className="px-4 py-3 text-right font-mono text-[#475569]">{E2.surfaces.black.tinymlR}</td>
              </tr>
              {/* 투명 아크릴 */}
              <tr>
                <td className="px-4 py-3 font-medium text-[#111827]">
                  투명 아크릴
                  <span className="ml-1.5 text-xs font-normal text-[#f59e0b]">★TinyML Best</span>
                </td>
                <td className="px-4 py-3 text-right text-[#475569]">{E2.surfaces.acryl.raw.rmse}</td>
                <td className="px-4 py-3 text-right text-[#10b981]">{E2.surfaces.acryl.fixed.rmse}</td>
                <td className="px-4 py-3 text-right text-[#2563eb]">{E2.surfaces.acryl.cm.rmse}</td>
                <td className="px-4 py-3 text-right font-semibold text-[#7c3aed]">{E2.surfaces.acryl.tinyml.rmse}</td>
                <td className="px-4 py-3 text-right font-mono text-[#475569]">{E2.surfaces.acryl.cmRMean}</td>
                <td className="px-4 py-3 text-right font-mono text-[#475569]">{E2.surfaces.acryl.signalRate} MCps</td>
                <td className="px-4 py-3 text-right font-mono text-[#475569]">{E2.surfaces.acryl.tinymlR} ★</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 text-xs text-[#64748b]">
          단위: RMSE(mm), cm_R/TinyML R̂(mm²), Signal Rate(MCps).
          TinyML R̂이 CM-AKF R̂에 비해 아크릴에서 더 가깝게 추적됨(104.22 vs 127.27).
        </div>
      </div>

      {/* 해석 주석 */}
      <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-xs text-[#64748b]">
        <p className="font-semibold text-[#475569]">해석</p>
        <ul className="mt-1 space-y-1">
          <li>· 흰/검정 우드락: CM-AKF가 TinyML보다 낮은 RMSE. signal_rate 차이(11~20 MCps)가 R̂ 단조성에 반영됨.</li>
          <li>· 투명 아크릴: 고유 반사 패턴이 6-feature TinyML 모델에 유리. CM-AKF 대비 0.21mm 낮음.</li>
          <li>· {E2.surfaces.acryl.note}</li>
        </ul>
      </div>
    </div>
  );
}
