import { PAPER_RESULTS } from "@/lib/paper-results";

const E5 = PAPER_RESULTS.E5;

export default function E5View() {
  const cmImprovement = (((E5.raw.rmse - E5.cm.rmse) / E5.raw.rmse) * 100).toFixed(1);
  const tinymlVsCm = (E5.tinyml.rmse - E5.cm.rmse).toFixed(2);

  return (
    <div className="space-y-6">
      {/* 개요 카드 */}
      <div className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
          E5 — 미지 표면 일반화
        </p>
        <p className="mt-1 text-sm text-[#475569]">{E5.description}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 text-[#64748b]">
            {E5.runs}run · {E5.totalFrames}frame
          </span>
          <span className="rounded-full border border-[#fde68a] bg-[#fffbeb] px-3 py-1 text-[#92400e]">
            E2 훈련 데이터에 없는 표면
          </span>
        </div>
      </div>

      {/* RMSE 비교 카드 */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#64748b]">Raw ToF</p>
          <p className="mt-2 text-2xl font-bold text-[#dc2626]">{E5.raw.rmse} mm</p>
          <p className="mt-0.5 text-xs text-[#94a3b8]">MAE {E5.raw.mae} mm</p>
        </div>
        <div className="rounded-lg border border-[#d1fae5] bg-[#f0fdf4] p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#10b981]">Fixed KF</p>
          <p className="mt-2 text-2xl font-bold text-[#047857]">{E5.fixed.rmse} mm</p>
          <p className="mt-0.5 text-xs text-[#34d399]">MAE {E5.fixed.mae} mm · NIS {E5.fixed.nis != null ? `${(E5.fixed.nis * 100).toFixed(1)}%` : "—"}</p>
        </div>
        <div className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#2563eb]">CM-AKF</p>
          <p className="mt-2 text-2xl font-bold text-[#1d4ed8]">{E5.cm.rmse} mm</p>
          <p className="mt-0.5 text-xs text-[#93c5fd]">MAE {E5.cm.mae} mm · {cmImprovement}% 개선</p>
        </div>
        <div className="rounded-lg border border-[#ede9fe] bg-[#faf5ff] p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#7c3aed]">TinyML-AKF</p>
          <p className="mt-2 text-2xl font-bold text-[#6d28d9]">{E5.tinyml.rmse} mm</p>
          <p className="mt-0.5 text-xs text-[#a78bfa]">MAE {E5.tinyml.mae} mm · CM+{tinymlVsCm}mm</p>
        </div>
      </div>

      {/* 알고리즘 순위 + 해석 */}
      <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-[#111827]">성능 순위 (RMSE 기준)</h3>
        <div className="mt-3 space-y-2">
          {[
            { rank: 1, label: "CM-AKF", rmse: E5.cm.rmse, color: "#2563eb", note: "미지 표면 최적 적응" },
            { rank: 2, label: "TinyML-AKF", rmse: E5.tinyml.rmse, color: "#7c3aed", note: `CM보다 +${tinymlVsCm}mm (일반화 한계)` },
            { rank: 3, label: "Fixed KF", rmse: E5.fixed.rmse, color: "#10b981", note: "고정 R — 표면 변화 미적응" },
            { rank: 4, label: "Raw ToF", rmse: E5.raw.rmse, color: "#64748b", note: "필터 없음" },
          ].map(({ rank, label, rmse, color, note }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-5 text-center text-xs font-bold text-[#94a3b8]">{rank}</span>
              <div className="flex flex-1 items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-medium" style={{ color }}>{label}</span>
              </div>
              <span className="font-mono text-sm font-semibold text-[#111827]">{rmse} mm</span>
              <span className="text-xs text-[#94a3b8]">{note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Anomaly 강조 박스 */}
      <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-5 shadow-sm">
        <p className="text-xs font-semibold text-[#dc2626]">⚠ Run 5 — 비정상 R̂ 피크</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs text-[#94a3b8]">cm_R_max (Run 5)</p>
            <p className="text-2xl font-bold text-[#dc2626]">{E5.run5CmRMax} mm²</p>
          </div>
          <div className="flex-1 text-sm text-[#7f1d1d]">
            Run 5에서 cm_R이 {E5.run5CmRMax}mm²로 폭발적 상승.
            회색 우드락 특유의 반사 특성이 CM-AKF R̂ 추정에 급격한 변화를 유발한 것으로 추정.
            TinyML은 이 피크를 학습 데이터에서 본 적 없어 추적 어려움.
          </div>
        </div>
      </div>

      {/* Signal Rate + 일반화 해석 */}
      <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-[#111827]">미지 표면 반사 특성</h3>
        <div className="mt-3 divide-y divide-[#f1f5f9]">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[#475569]">회색 우드락 Signal Rate</span>
            <span className="text-sm font-semibold text-[#111827]">{E5.graySignalRate} MCps</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[#475569]">흰 우드락 Signal Rate (비교)</span>
            <span className="text-sm font-semibold text-[#94a3b8]">~15.5 MCps</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[#475569]">차이</span>
            <span className="text-sm font-semibold text-[#f59e0b]">≈ 0.52 MCps 낮음</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-[#64748b]">
          회색 표면은 흰 표면과 유사하나 signal_rate가 약간 낮음.
          TinyML 6-feature 모델에서 signal_rate 특성이 약간 다른 경우에도 적응 가능한지 검증됨 — 일부 적응 한계 확인.
        </p>
      </div>

      {/* 한계 주석 */}
      <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-xs text-[#64748b]">
        <p className="font-semibold text-[#475569]">한계 및 해석 주의사항</p>
        <p className="mt-1">{E5.note}</p>
        <p className="mt-1">
          TinyML이 CM-AKF보다 0.53mm 높은 RMSE를 보이는 것은 6-feature 모델이
          E2(흰/검정/아크릴) 훈련 데이터 분포에 최적화되어 있기 때문입니다.
          미지 표면에서의 일반화 성능 향상을 위해서는 추가 표면 데이터 수집이 필요합니다.
        </p>
      </div>
    </div>
  );
}
