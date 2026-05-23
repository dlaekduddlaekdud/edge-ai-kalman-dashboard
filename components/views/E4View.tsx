import { PAPER_RESULTS } from "@/lib/paper-results";

const E4 = PAPER_RESULTS.E4;
const TINYML_BUDGET_US = PAPER_RESULTS.realtime.tinymlBudget_us; // 500 µs
const MAIN_LOOP_BUDGET_MS = PAPER_RESULTS.realtime.mainLoopBudget_ms; // 5 ms

function GaugeCard({
  title,
  actual,
  budget,
  usagePct,
  unit,
  note,
  color,
}: {
  title: string;
  actual: string;
  budget: string;
  usagePct: number;
  unit: string;
  note?: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">{title}</p>
      <div className="mt-3 flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-[#111827]">{actual}</p>
          <p className="text-xs text-[#94a3b8]">실측 / 예산 {budget}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold" style={{ color }}>{usagePct.toFixed(1)}%</p>
          <p className="text-xs text-[#94a3b8]">예산 사용</p>
        </div>
      </div>
      {/* Progress bar */}
      <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(usagePct, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      {note && <p className="mt-2 text-xs text-[#94a3b8]">{note}</p>}
    </div>
  );
}

function StatRow({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-[#475569]">{label}</span>
      <span className="text-sm font-semibold text-[#111827]">
        {value}
        {unit && <span className="ml-1 text-xs font-normal text-[#94a3b8]">{unit}</span>}
      </span>
    </div>
  );
}

export default function E4View() {
  const tinymlUsagePct = (E4.tinymlInferMean_us / TINYML_BUDGET_US) * 100;
  const mainLoopUsagePct = (E4.mainLoopMean_ms / MAIN_LOOP_BUDGET_MS) * 100;

  return (
    <div className="space-y-6">
      {/* 개요 카드 */}
      <div className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
          E4 — 정적 장기 안정성
        </p>
        <p className="mt-1 text-sm text-[#475569]">{E4.description}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 text-[#64748b]">
            {E4.runs}run
          </span>
          <span className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 text-[#64748b]">
            {E4.totalFrames.toLocaleString()} frames (30분 × 3)
          </span>
          <span className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 text-[#64748b]">
            측정 거리: 500 mm
          </span>
        </div>
      </div>

      {/* 위치 추정 정밀도 카드 */}
      <div className="rounded-lg border border-[#d9e0ea] bg-white shadow-sm">
        <div className="border-b border-[#f1f5f9] px-6 py-4">
          <h3 className="text-base font-semibold text-[#111827]">위치 추정 정밀도 (정적 500mm)</h3>
          <p className="mt-0.5 text-xs text-[#94a3b8]">
            정적 실험이므로 RMSEss / Tconv 미적용. RMSE/MAE/NIS 기준.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f8fafc]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#475569]">알고리즘</th>
                <th className="px-4 py-3 text-right font-semibold text-[#475569]">RMSE (mm)</th>
                <th className="px-4 py-3 text-right font-semibold text-[#475569]">MAE (mm)</th>
                <th className="px-4 py-3 text-right font-semibold text-[#475569]">NIS 95%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              <tr>
                <td className="px-4 py-3 text-[#64748b]">Raw ToF</td>
                <td className="px-4 py-3 text-right">{E4.raw.rmse}</td>
                <td className="px-4 py-3 text-right">{E4.raw.mae}</td>
                <td className="px-4 py-3 text-right text-[#94a3b8]">—</td>
              </tr>
              <tr className="bg-[#fafafa]">
                <td className="px-4 py-3 text-[#0f766e]">Fixed KF</td>
                <td className="px-4 py-3 text-right">{E4.fixed.rmse}</td>
                <td className="px-4 py-3 text-right">{E4.fixed.mae}</td>
                <td className="px-4 py-3 text-right">{E4.fixed.nis != null ? `${(E4.fixed.nis * 100).toFixed(1)}%` : "—"}</td>
              </tr>
              <tr>
                <td className="px-4 py-3 font-semibold text-[#7c3aed]">CM-AKF</td>
                <td className="px-4 py-3 text-right font-semibold text-[#7c3aed]">{E4.cm.rmse}</td>
                <td className="px-4 py-3 text-right">{E4.cm.mae}</td>
                <td className="px-4 py-3 text-right">{E4.cm.nis != null ? `${(E4.cm.nis * 100).toFixed(1)}%` : "—"}</td>
              </tr>
              <tr className="bg-[#fafafa]">
                <td className="px-4 py-3 text-[#ea580c]">TinyML-AKF</td>
                <td className="px-4 py-3 text-right text-[#ea580c]">{E4.tinyml.rmse}</td>
                <td className="px-4 py-3 text-right">{E4.tinyml.mae}</td>
                <td className="px-4 py-3 text-right text-[#94a3b8]">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 실시간 성능 게이지 */}
      <div className="grid gap-4 sm:grid-cols-2">
        <GaugeCard
          title="TinyML 추론 시간"
          actual={`${E4.tinymlInferMean_us} µs`}
          budget={`${TINYML_BUDGET_US.toLocaleString()} µs (0.5ms 목표)`}
          usagePct={tinymlUsagePct}
          unit="µs"
          color="#ea580c"
          note={`최대 ${E4.tinymlInferMax_us} µs · std ${E4.tinymlInferStd_us} µs · ${E4.tinymlInferCount.toLocaleString()}회`}
        />
        <GaugeCard
          title="메인 루프 시간"
          actual={`${E4.mainLoopMean_ms} ms`}
          budget={`${MAIN_LOOP_BUDGET_MS} ms`}
          usagePct={mainLoopUsagePct}
          unit="ms"
          color="#0f766e"
          note={`최대 ${E4.mainLoopMax_ms} ms · 오버런 ${E4.overrunCount}/${E4.totalLoopCount.toLocaleString()}`}
        />
      </div>

      {/* TinyML 여유 마진 강조 */}
      <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-5 shadow-sm">
        <p className="text-xs font-semibold text-[#ea580c]">TinyML 추론 여유 마진</p>
        <div className="mt-3 flex flex-wrap gap-4">
          <div className="rounded-md bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-[#94a3b8]">예산</p>
            <p className="text-xl font-bold text-[#111827]">{TINYML_BUDGET_US.toLocaleString()} µs</p>
          </div>
          <div className="flex items-center">
            <span className="text-2xl text-[#ea580c]">÷</span>
          </div>
          <div className="rounded-md bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-[#94a3b8]">실측</p>
            <p className="text-xl font-bold text-[#111827]">{E4.tinymlInferMean_us} µs</p>
          </div>
          <div className="flex items-center">
            <span className="text-2xl text-[#ea580c]">=</span>
          </div>
          <div className="rounded-md bg-[#ea580c] px-4 py-3 shadow-sm">
            <p className="text-xs text-[#fde68a]">여유 마진</p>
            <p className="text-2xl font-bold text-white">
              {(TINYML_BUDGET_US / E4.tinymlInferMean_us).toFixed(1)}×
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-[#92400e]">
          TinyML 추론 목표 0.5ms 대비 사용률은 {tinymlUsagePct.toFixed(2)}%.
          200Hz 메인 루프 5ms 예산은 별도 게이지에서 확인합니다.
        </p>
      </div>

      {/* R̂ drift (cm_R 30분 장기 안정성) */}
      <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
          cm_R 30분 Drift 안정성
        </p>
        <div className="mt-3 divide-y divide-[#f1f5f9]">
          <StatRow label="R̂ Drift CV (변동계수)" value={`${E4.cmRDriftCV}%`} />
          <StatRow label="오버런 횟수" value={`${E4.overrunCount} / ${E4.totalLoopCount.toLocaleString()}`} />
          <StatRow label="총 측정 루프" value={E4.totalLoopCount.toLocaleString()} unit="cycles" />
        </div>
        <div className="mt-3 rounded-md bg-[#f0fdf4] px-3 py-2">
          <p className="text-sm font-semibold text-[#15803d]">
            CV = {E4.cmRDriftCV}% → 30분 연속 동작에서 R̂ 안정적
          </p>
          <p className="mt-0.5 text-xs text-[#4ade80]">
            CV ≤ 5%: 안정. 매우 낮은 수준의 장기 드리프트 확인.
          </p>
        </div>
      </div>

      <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-xs text-[#64748b]">
        ⚠️ 실측값은 E4 정적 실험(30분) 기준. 동적 주행 조건에서 추론 시간 및 루프 타이밍이 달라질 수 있음.
      </div>
    </div>
  );
}
