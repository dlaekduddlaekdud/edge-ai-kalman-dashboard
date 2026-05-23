import { PAPER_RESULTS } from "@/lib/paper-results";

const RT = PAPER_RESULTS.realtime;
const E4 = PAPER_RESULTS.E4;

// ── 게이지 컴포넌트 ────────────────────────────────────────────────────────

function GaugeSection({
  title,
  subtitle,
  actual,
  actualUnit,
  budget,
  budgetUnit,
  usagePct,
  color,
  note,
}: {
  title: string;
  subtitle?: string;
  actual: number;
  actualUnit: string;
  budget: number;
  budgetUnit: string;
  usagePct: number;
  color: string;
  note?: string;
}) {
  return (
    <div className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold text-[#111827]">{title}</p>
      {subtitle && <p className="mt-0.5 text-xs text-[#94a3b8]">{subtitle}</p>}
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <p className="text-xs text-[#64748b]">실측 평균</p>
          <p className="text-3xl font-bold" style={{ color }}>
            {actual}
            <span className="ml-1 text-base font-normal text-[#64748b]">{actualUnit}</span>
          </p>
        </div>
        <div className="text-[#94a3b8]">
          <p className="text-xs">예산</p>
          <p className="text-lg font-semibold">
            {budget} {budgetUnit}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#64748b]">사용률</p>
          <p className="text-2xl font-bold" style={{ color }}>
            {usagePct.toFixed(2)}%
          </p>
        </div>
      </div>
      <div className="mt-4 h-4 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
        <div
          className="flex h-full items-center justify-end rounded-full pr-2 text-xs font-semibold text-white transition-all"
          style={{
            width: `${Math.max(usagePct, 2)}%`,
            backgroundColor: color,
            minWidth: "2%",
          }}
        >
          {usagePct > 5 ? `${usagePct.toFixed(1)}%` : ""}
        </div>
      </div>
      <div className="mt-1 flex justify-between text-xs text-[#94a3b8]">
        <span>0</span>
        <span>예산 한도 ({budget} {budgetUnit})</span>
      </div>
      {note && (
        <p className="mt-3 rounded-md bg-[#f8fafc] px-3 py-2 text-xs text-[#64748b]">{note}</p>
      )}
    </div>
  );
}

// ── 페이지 ────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const tinymlUsagePct = (RT.tinymlActual_us / RT.tinymlBudget_us) * 100;
  const mainLoopUsagePct = (RT.mainLoopActual_ms / RT.mainLoopBudget_ms) * 100;

  return (
    <div className="space-y-10">
      {/* 헤더 */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">Results</p>
        <h2 className="mt-2 text-2xl font-semibold text-[#111827]">연구 질문별 결과</h2>
        <p className="mt-2 text-sm text-[#64748b]">
          논문 5.2절 RQ1~RQ3 결과 요약. 모든 수치는 논문 확정값.
        </p>
      </section>

      {/* ── RQ1 ──────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="border-l-4 border-[#ea580c] pl-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#ea580c]">RQ1</p>
          <h3 className="mt-1 text-lg font-semibold text-[#111827]">
            TinyML-AKF는 MCU에서 실시간 실행 가능한가?
          </h3>
          <p className="mt-1 text-sm text-[#64748b]">
            STM32F446RE 200Hz 루프 예산 내 TinyML 추론 실시간성 검증.
            실측은 E4 정적 실험(30분, {E4.totalLoopCount.toLocaleString()} 루프) 기준.
          </p>
        </div>

        <div className="rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-xs text-[#1e40af]">
          DWT 사이클 카운터 기준. {RT.dwtCycles.toLocaleString()} cycles @ {RT.cpuFreqMHz} MHz = {RT.dwtToMs} ms.
          측정 횟수: {E4.tinymlInferCount.toLocaleString()}회.
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <GaugeSection
            title="TinyML 추론 시간"
            subtitle="STM32F446RE 온보드 INT8 양자화 모델 (6-feature, 목표 <0.5 ms)"
            actual={RT.tinymlActual_us}
            actualUnit="µs"
            budget={RT.tinymlBudget_us}
            budgetUnit="µs"
            usagePct={tinymlUsagePct}
            color="#ea580c"
            note={`최대 ${E4.tinymlInferMax_us} µs · std ${E4.tinymlInferStd_us} µs · ${E4.tinymlInferCount.toLocaleString()}회 측정`}
          />
          <GaugeSection
            title="메인 루프 실행 시간"
            subtitle="ToF 읽기 + 칼만 필터 + TinyML 포함 전체 루프"
            actual={RT.mainLoopActual_ms}
            actualUnit="ms"
            budget={RT.mainLoopBudget_ms}
            budgetUnit="ms"
            usagePct={mainLoopUsagePct}
            color="#2563eb"
            note={`최대 ${E4.mainLoopMax_ms} ms · 오버런 ${RT.overrunCount}/${RT.totalCycles.toLocaleString()} (0%)`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-5 shadow-sm">
            <p className="text-xs font-semibold text-[#ea580c]">TinyML 여유 마진</p>
            <p className="mt-2 text-3xl font-bold text-[#92400e]">{RT.tinymlMarginX}×</p>
            <p className="mt-1 text-xs text-[#d97706]">
              {RT.tinymlBudget_us.toLocaleString()} µs ÷ {RT.tinymlActual_us} µs
            </p>
          </div>
          <div className="rounded-lg border border-[#d4d4d8] bg-[#f4f4f5] p-5 shadow-sm">
            <p className="text-xs font-semibold text-[#0f766e]">오버런 횟수</p>
            <p className="mt-2 text-3xl font-bold text-[#9f1239]">{RT.overrunCount}</p>
            <p className="mt-1 text-xs text-[#5eead4]">
              / {RT.totalCycles.toLocaleString()} 루프 (0%)
            </p>
          </div>
          <div className="rounded-lg border border-[#dbeafe] bg-[#eff6ff] p-5 shadow-sm">
            <p className="text-xs font-semibold text-[#2563eb]">루프 사용률</p>
            <p className="mt-2 text-3xl font-bold text-[#1d4ed8]">{RT.mainLoopUsage}%</p>
            <p className="mt-1 text-xs text-[#93c5fd]">
              {RT.mainLoopActual_ms} ms / {RT.mainLoopBudget_ms} ms 예산
            </p>
          </div>
        </div>

        <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-xs text-[#64748b]">
          ⚠️ {RT.note}
        </div>
      </section>

      {/* ── RQ2 ──────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="border-l-4 border-[#2563eb] pl-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#2563eb]">RQ2</p>
          <h3 className="mt-1 text-lg font-semibold text-[#111827]">
            노이즈 변화 환경에서 적응 필터가 Fixed KF보다 정확한가?
          </h3>
          <p className="mt-1 text-sm text-[#64748b]">
            E2(벽 재질별) · E3(ToF 차단) · E5(미지 표면) 시나리오 RMSE 비교. CM-AKF와 TinyML-AKF 개선율 포함.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#d9e0ea] bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f8fafc]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#475569]">시나리오</th>
                <th className="px-4 py-3 text-right font-semibold text-[#475569]">Fixed KF</th>
                <th className="px-4 py-3 text-right font-semibold text-[#7c3aed]">CM-AKF</th>
                <th className="px-4 py-3 text-right font-semibold text-[#7c3aed]">개선율 (CM)</th>
                <th className="px-4 py-3 text-right font-semibold text-[#ea580c]">TinyML-AKF</th>
                <th className="px-4 py-3 text-right font-semibold text-[#ea580c]">개선율 (TinyML)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {[
                { label: "E2 흰 우드락",   fixed: PAPER_RESULTS.E2.surfaces.white.fixed.rmse, cm: PAPER_RESULTS.E2.surfaces.white.cm.rmse, tinyml: PAPER_RESULTS.E2.surfaces.white.tinyml.rmse },
                { label: "E2 검정 우드락", fixed: PAPER_RESULTS.E2.surfaces.black.fixed.rmse, cm: PAPER_RESULTS.E2.surfaces.black.cm.rmse, tinyml: PAPER_RESULTS.E2.surfaces.black.tinyml.rmse },
                { label: "E2 투명 아크릴", fixed: PAPER_RESULTS.E2.surfaces.acryl.fixed.rmse, cm: PAPER_RESULTS.E2.surfaces.acryl.cm.rmse, tinyml: PAPER_RESULTS.E2.surfaces.acryl.tinyml.rmse },
                { label: "E3 ToF 차단",    fixed: PAPER_RESULTS.E3.fixed.rmse,                cm: PAPER_RESULTS.E3.cm.rmse,                tinyml: PAPER_RESULTS.E3.tinyml.rmse },
                { label: "E5 미지 표면",   fixed: PAPER_RESULTS.E5.fixed.rmse,                cm: PAPER_RESULTS.E5.cm.rmse,                tinyml: PAPER_RESULTS.E5.tinyml.rmse },
              ].map(({ label, fixed, cm, tinyml }) => {
                const cmImprov = (((fixed - cm) / fixed) * 100).toFixed(1);
                const tmlImprov = (((fixed - tinyml) / fixed) * 100).toFixed(1);
                const cmPositive = cm < fixed;
                const tmlPositive = tinyml < fixed;
                return (
                  <tr key={label}>
                    <td className="px-4 py-3 font-medium text-[#111827]">{label}</td>
                    <td className="px-4 py-3 text-right text-[#475569]">{fixed.toFixed(2)} mm</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#7c3aed]">{cm.toFixed(2)} mm</td>
                    <td className={`px-4 py-3 text-right font-semibold ${cmPositive ? "text-[#7c3aed]" : "text-[#dc2626]"}`}>
                      {cmPositive ? "↓" : "↑"} {Math.abs(parseFloat(cmImprov)).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right text-[#ea580c]">{tinyml.toFixed(2)} mm</td>
                    <td className={`px-4 py-3 text-right font-semibold ${tmlPositive ? "text-[#ea580c]" : "text-[#dc2626]"}`}>
                      {tmlPositive ? "↓" : "↑"} {Math.abs(parseFloat(tmlImprov)).toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#94a3b8]">
          단위: mm (RMSE). 개선율 = (Fixed KF − Adaptive) / Fixed KF × 100. ↓ = 개선, ↑ = 저하.
        </p>
      </section>

      {/* ── RQ3 ──────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="border-l-4 border-[#f59e0b] pl-4">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#d97706]">RQ3</p>
          <h3 className="mt-1 text-lg font-semibold text-[#111827]">
            TinyML-AKF는 CM-AKF의 실용적 대안인가?
          </h3>
          <p className="mt-1 text-sm text-[#64748b]">
            온디바이스 R̂ 추론 기반 TinyML-AKF와 CM-AKF의 시나리오별 RMSE 비교.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-[#d9e0ea] bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f8fafc]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#475569]">시나리오</th>
                <th className="px-4 py-3 text-right font-semibold text-[#7c3aed]">CM-AKF</th>
                <th className="px-4 py-3 text-right font-semibold text-[#ea580c]">TinyML-AKF</th>
                <th className="px-4 py-3 text-right font-semibold text-[#475569]">차이</th>
                <th className="px-4 py-3 text-left font-semibold text-[#475569]">특이사항</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {[
                { label: "E1 정상 baseline",   cm: PAPER_RESULTS.E1.cm.rmse,                  tinyml: PAPER_RESULTS.E1.tinyml.rmse,                  note: "—" },
                { label: "E2 흰 우드락",        cm: PAPER_RESULTS.E2.surfaces.white.cm.rmse,   tinyml: PAPER_RESULTS.E2.surfaces.white.tinyml.rmse,   note: "CM 우세" },
                { label: "E2 검정 우드락",      cm: PAPER_RESULTS.E2.surfaces.black.cm.rmse,   tinyml: PAPER_RESULTS.E2.surfaces.black.tinyml.rmse,   note: "CM 우세" },
                { label: "E2 투명 아크릴 ★",   cm: PAPER_RESULTS.E2.surfaces.acryl.cm.rmse,   tinyml: PAPER_RESULTS.E2.surfaces.acryl.tinyml.rmse,   note: "TinyML Best" },
                { label: "E3 ToF 차단",         cm: PAPER_RESULTS.E3.cm.rmse,                  tinyml: PAPER_RESULTS.E3.tinyml.rmse,                  note: `TinyML R̂ 회복 ${PAPER_RESULTS.E3.recoverySpeedup}× 빠름` },
                { label: "E4 정적 안정성",      cm: PAPER_RESULTS.E4.cm.rmse,                  tinyml: PAPER_RESULTS.E4.tinyml.rmse,                  note: "거의 동등" },
                { label: "E5 미지 표면",         cm: PAPER_RESULTS.E5.cm.rmse,                  tinyml: PAPER_RESULTS.E5.tinyml.rmse,                  note: "CM 우세, 일반화 한계" },
              ].map(({ label, cm, tinyml, note }) => {
                const diff = tinyml - cm;
                const diffStr = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
                const isBetter = tinyml < cm;
                return (
                  <tr key={label} className={label.includes("★") ? "bg-[#fefce8]" : ""}>
                    <td className="px-4 py-3 font-medium text-[#111827]">{label}</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#7c3aed]">{cm.toFixed(2)} mm</td>
                    <td className="px-4 py-3 text-right font-semibold text-[#ea580c]">{tinyml.toFixed(2)} mm</td>
                    <td className={`px-4 py-3 text-right font-semibold ${isBetter ? "text-[#7c3aed]" : "text-[#dc2626]"}`}>
                      {diffStr} mm
                    </td>
                    <td className="px-4 py-3 text-xs text-[#64748b]">{note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#94a3b8]">
          ★ E2 아크릴: 유일하게 TinyML-AKF가 CM-AKF보다 낮은 RMSE. 아크릴 고유 반사 패턴이 6-feature 모델에 유리하게 작용.
          E3: RMSE는 CM이 낮지만 TinyML이 R̂ 회복 2.67× 빠름(60ms vs 160ms).
        </p>
      </section>

      {/* ── 표 5-2 종합 ──────────────────────────────────────────────────── */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">논문 표 5-2</p>
        <h3 className="mt-1 text-base font-semibold text-[#111827]">시나리오별 알고리즘 RMSE 종합 (mm)</h3>
        <p className="mt-1 text-xs text-[#94a3b8]">논문 확정 수치. TinyML NIS는 innovation_cov 미제공으로 항상 —.</p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-[#f8fafc]">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold text-[#475569]">시나리오</th>
                <th className="px-4 py-2.5 text-right font-semibold text-[#475569]">Raw</th>
                <th className="px-4 py-2.5 text-right font-semibold text-[#475569]">Fixed KF</th>
                <th className="px-4 py-2.5 text-right font-semibold text-[#7c3aed]">CM-AKF</th>
                <th className="px-4 py-2.5 text-right font-semibold text-[#ea580c]">TinyML-AKF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              <tr>
                <td className="px-4 py-2.5 font-medium text-[#111827]">E1 — 정상 baseline</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E1.raw.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E1.fixed.rmse}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-[#7c3aed]">{PAPER_RESULTS.E1.cm.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#ea580c]">{PAPER_RESULTS.E1.tinyml.rmse}</td>
              </tr>
              <tr className="bg-[#fafafa]">
                <td className="px-4 py-2.5 text-[#475569]">E2 — 흰 우드락</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E2.surfaces.white.raw.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E2.surfaces.white.fixed.rmse}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-[#7c3aed]">{PAPER_RESULTS.E2.surfaces.white.cm.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#ea580c]">{PAPER_RESULTS.E2.surfaces.white.tinyml.rmse}</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-[#475569]">E2 — 검정 우드락</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E2.surfaces.black.raw.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E2.surfaces.black.fixed.rmse}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-[#7c3aed]">{PAPER_RESULTS.E2.surfaces.black.cm.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#ea580c]">{PAPER_RESULTS.E2.surfaces.black.tinyml.rmse}</td>
              </tr>
              <tr className="bg-[#fafafa]">
                <td className="px-4 py-2.5 text-[#475569]">
                  E2 — 투명 아크릴
                  <span className="ml-1 text-xs text-[#f59e0b]">★TinyML Best</span>
                </td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E2.surfaces.acryl.raw.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E2.surfaces.acryl.fixed.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#7c3aed]">{PAPER_RESULTS.E2.surfaces.acryl.cm.rmse}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-[#ea580c]">{PAPER_RESULTS.E2.surfaces.acryl.tinyml.rmse}</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-medium text-[#111827]">E3 — ToF 차단 구간</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E3.raw.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E3.fixed.rmse}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-[#7c3aed]">{PAPER_RESULTS.E3.cm.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#ea580c]">{PAPER_RESULTS.E3.tinyml.rmse}</td>
              </tr>
              <tr className="bg-[#fafafa]">
                <td className="px-4 py-2.5 text-[#475569]">E4 — 정적 장기 안정성</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E4.raw.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E4.fixed.rmse}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-[#7c3aed]">{PAPER_RESULTS.E4.cm.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#ea580c]">{PAPER_RESULTS.E4.tinyml.rmse}</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-[#475569]">E5 — 미지 표면 일반화</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E5.raw.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#475569]">{PAPER_RESULTS.E5.fixed.rmse}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-[#7c3aed]">{PAPER_RESULTS.E5.cm.rmse}</td>
                <td className="px-4 py-2.5 text-right text-[#ea580c]">{PAPER_RESULTS.E5.tinyml.rmse}</td>
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
