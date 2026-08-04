"use client";

import { E1_ALGORITHM_COLORS, type E1AlgorithmId } from "@/lib/e1-store";
import { PAPER_RESULTS } from "@/lib/paper-results";

const ROWS = [
  { id: "raw",    label: "Raw ToF",    m: PAPER_RESULTS.E3.raw },
  { id: "fixed",  label: "Fixed KF",   m: PAPER_RESULTS.E3.fixed },
  { id: "cm",     label: "CM-AKF",     m: PAPER_RESULTS.E3.cm },
  { id: "tinyml", label: "TinyML-AKF", m: PAPER_RESULTS.E3.tinyml },
] as const;

interface Props {
  selectedAlgorithms: E1AlgorithmId[];
}

/**
 * E3 알고리즘별 성능 표. 논문 확정값 기준이며 업로드 CSV로 재계산하지 않는다.
 * Raw와 TinyML-AKF의 NIS는 innovation_cov 부재로 계산 불가하므로 "—"로 표시한다.
 */
export default function E3MetricsTable({ selectedAlgorithms }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-[#d1d5db] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#e5e7eb] px-6 py-4">
        <p className="text-2xl font-black text-[#111827]">알고리즘별 성능 (E3 — ToF 차단 구간)</p>
        <span className="rounded-full border border-[#111827] bg-[#111827] px-3 py-1 text-sm font-bold text-white">
          논문 확정값
        </span>
      </div>
      <table className="w-full min-w-[760px] table-fixed text-base">
        <colgroup>
          <col className="w-[30%]" />
          <col className="w-[17.5%]" />
          <col className="w-[17.5%]" />
          <col className="w-[17.5%]" />
          <col className="w-[17.5%]" />
        </colgroup>
        <thead className="bg-[#f8fafc]">
          <tr>
            <th className="px-6 py-4 text-left font-black text-[#374151]">알고리즘</th>
            <th className="px-6 py-4 text-right font-black text-[#374151]">RMSE</th>
            <th className="px-6 py-4 text-right font-black text-[#374151]">MAE</th>
            <th className="px-6 py-4 text-right font-black text-[#374151]">NIS 95%</th>
            <th className="px-6 py-4 text-right font-black text-[#374151]">RMSEss</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb]">
          {ROWS.filter(({ id }) => selectedAlgorithms.includes(id as E1AlgorithmId)).map(
            ({ id, label, m }) => (
              <tr key={id}>
                <td className="px-6 py-4 font-bold text-[#111827]">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: E1_ALGORITHM_COLORS[id as E1AlgorithmId] }}
                    />
                    {label}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-semibold text-[#111827]">
                  {m.rmse.toFixed(2)} mm
                </td>
                <td className="px-6 py-4 text-right font-semibold text-[#111827]">
                  {m.mae.toFixed(2)} mm
                </td>
                <td className="px-6 py-4 text-right font-semibold text-[#111827]">
                  {id === "tinyml" || id === "raw"
                    ? "—"
                    : m.nis != null
                      ? `${(m.nis * 100).toFixed(1)}%`
                      : "—"}
                </td>
                <td className="px-6 py-4 text-right font-semibold text-[#111827]">
                  {m.rmseSS != null ? `${m.rmseSS.toFixed(2)} mm` : "—"}
                </td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
