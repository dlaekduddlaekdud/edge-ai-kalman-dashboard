"use client";

import Link from "next/link";
import { useE1Store } from "@/lib/e1-store";
import { type ScenarioLabel } from "@/lib/dataset";
import E0View from "@/components/views/E0View";
import E1View from "@/components/views/E1View";
import E2View from "@/components/views/E2View";
import E3View from "@/components/views/E3View";
import E4View from "@/components/views/E4View";
import E5View from "@/components/views/E5View";
import { PAPER_RESULTS } from "@/lib/paper-results";

const SCENARIO_DESCRIPTIONS: Record<ScenarioLabel, string> = {
  E0: "합성 데이터 — Fixed KF 단독",
  E1: "정상 baseline — 알고리즘 비교",
  E2: "벽 재질별 — 알고리즘 비교",
  E3: "ToF 차단 구간 — 알고리즘 비교",
  E4: "R_hat drift — 알고리즘 비교",
  E5: "신호 감쇠 — 알고리즘 비교",
};

export default function DashboardPage() {
  const { runs, activeScenario } = useE1Store();
  const hasData = Object.values(runs).some((r) => r !== undefined);

  // E0/E2/E4/E5는 CSV 없이도 하드코딩 카드 표시. E1/E3만 데이터 필요.
  const csvRequired = activeScenario === "E1" || activeScenario === "E3";
  const isEmpty = csvRequired && !hasData;
  const sourceLabel = csvRequired ? "업로드 CSV 계산값" : "논문 확정값";
  const sourceClassName = csvRequired
    ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]"
    : "border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]";

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
            Dashboard
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[#111827]">
            시나리오별 분석 대시보드
          </h2>
        </section>
        <section className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-6 shadow-sm">
          <p className="text-base font-semibold text-[#92400e]">업로드된 CSV가 없습니다.</p>
          <p className="mt-2 text-sm text-[#78350f]">
            먼저 실험 CSV를 업로드해야 대시보드를 확인할 수 있습니다.
          </p>
          <Link
            href="/upload"
            className="mt-4 inline-block rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
          >
            CSV 업로드하러 가기
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
          Dashboard
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[#111827]">
          시나리오별 분석 대시보드
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-sm font-semibold text-[#1d4ed8]">
            {activeScenario}
          </span>
          <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${sourceClassName}`}>
            {sourceLabel}
          </span>
          <span className="text-sm text-[#64748b]">
            {SCENARIO_DESCRIPTIONS[activeScenario]}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link href="/upload" className="text-xs text-[#2563eb] hover:underline">
            CSV 변경
          </Link>
        </div>
      </section>

      <section>
        {activeScenario === "E0" ? <E0View /> :
         activeScenario === "E1" ? <E1View /> :
         activeScenario === "E2" ? <E2View /> :
         activeScenario === "E3" ? <E3View /> :
         activeScenario === "E4" ? <E4View /> :
         activeScenario === "E5" ? <E5View /> :
         (
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-[#94a3b8]">
              {activeScenario} — 지원하지 않는 시나리오
            </p>
          </div>
        )}
      </section>

      {/* 표 5-2: 시나리오 × 알고리즘 종합 성능표 (항상 표시) */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
          논문 표 5-2
        </p>
        <h3 className="mt-1 text-base font-semibold text-[#111827]">
          시나리오별 알고리즘 RMSE 종합 (mm)
        </h3>
        <p className="mt-1 text-xs text-[#94a3b8]">
          논문 확정 수치. CSV 업로드 유무와 무관하게 표시됩니다.
          TinyML NIS는 innovation_cov 미제공으로 항상 —.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f8fafc]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold text-[#475569]">시나리오</th>
                <th className="px-4 py-2.5 text-right font-semibold text-[#475569]">Raw</th>
                <th className="px-4 py-2.5 text-right font-semibold text-[#475569]">Fixed KF</th>
                <th className="px-4 py-2.5 text-right font-semibold text-[#2563eb]">CM-AKF</th>
                <th className="px-4 py-2.5 text-right font-semibold text-[#7c3aed]">TinyML-AKF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {/* E1 */}
              <tr>
                <td className="px-4 py-2.5 font-medium text-[#111827]">E1 — 정상 baseline</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E1.raw.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E1.fixed.rmse}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-[#2563eb]">{PAPER_RESULTS.E1.cm.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#7c3aed]">{PAPER_RESULTS.E1.tinyml.rmse}</td>
              </tr>
              {/* E2 흰 */}
              <tr className="bg-[#fafafa]">
                <td className="px-4 py-2.5 text-[#475569]">E2 — 흰 우드락</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E2.surfaces.white.raw.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E2.surfaces.white.fixed.rmse}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-[#2563eb]">{PAPER_RESULTS.E2.surfaces.white.cm.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#7c3aed]">{PAPER_RESULTS.E2.surfaces.white.tinyml.rmse}</td>
              </tr>
              {/* E2 검정 */}
              <tr>
                <td className="px-4 py-2.5 text-[#475569]">E2 — 검정 우드락</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E2.surfaces.black.raw.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E2.surfaces.black.fixed.rmse}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-[#2563eb]">{PAPER_RESULTS.E2.surfaces.black.cm.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#7c3aed]">{PAPER_RESULTS.E2.surfaces.black.tinyml.rmse}</td>
              </tr>
              {/* E2 아크릴 */}
              <tr className="bg-[#fafafa]">
                <td className="px-4 py-2.5 text-[#475569]">
                  E2 — 투명 아크릴
                  <span className="ml-1 text-xs text-[#f59e0b]">★TinyML Best</span>
                </td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E2.surfaces.acryl.raw.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E2.surfaces.acryl.fixed.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#2563eb]">{PAPER_RESULTS.E2.surfaces.acryl.cm.rmse}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-[#7c3aed]">{PAPER_RESULTS.E2.surfaces.acryl.tinyml.rmse}</td>
              </tr>
              {/* E3 */}
              <tr>
                <td className="px-4 py-2.5 font-medium text-[#111827]">E3 — ToF 차단 구간</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E3.raw.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E3.fixed.rmse}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-[#2563eb]">{PAPER_RESULTS.E3.cm.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#7c3aed]">{PAPER_RESULTS.E3.tinyml.rmse}</td>
              </tr>
              {/* E4 */}
              <tr className="bg-[#fafafa]">
                <td className="px-4 py-2.5 text-[#475569]">E4 — 정적 장기 안정성</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E4.raw.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E4.fixed.rmse}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-[#2563eb]">{PAPER_RESULTS.E4.cm.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#7c3aed]">{PAPER_RESULTS.E4.tinyml.rmse}</td>
              </tr>
              {/* E5 */}
              <tr>
                <td className="px-4 py-2.5 text-[#475569]">E5 — 미지 표면 일반화</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E5.raw.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E5.fixed.rmse}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-[#2563eb]">{PAPER_RESULTS.E5.cm.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#7c3aed]">{PAPER_RESULTS.E5.tinyml.rmse}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-[#94a3b8]">
          단위: mm (RMSE). CM-AKF = Covariance-Matching AKF. TinyML-AKF = 온-디바이스 R̂ 추론.
          E3 TinyML 2.7× 빠른 R̂ 회복 (160ms → 60ms).
        </p>
      </section>
    </div>
  );
}
