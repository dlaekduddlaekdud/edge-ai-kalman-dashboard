import { PAPER_RESULTS } from "@/lib/paper-results";
import { ALGO_COLORS, semanticColors } from "@/lib/palette";

const RT = PAPER_RESULTS.realtime;
const E4data = PAPER_RESULTS.E4;

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
      <p className="text-xl font-bold text-[#111827]">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-[#94a3b8]">{subtitle}</p>}
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <div>
          <p className="text-sm text-[#64748b]">실측 평균</p>
          <p className="tabular-nums text-4xl font-black" style={{ color }}>
            {actual}
            <span className="ml-1 text-lg font-normal text-[#64748b]">{actualUnit}</span>
          </p>
        </div>
        <div className="text-[#94a3b8]">
          <p className="text-sm">예산</p>
          <p className="tabular-nums text-xl font-semibold">
            {budget} {budgetUnit}
          </p>
        </div>
        <div>
          <p className="text-sm text-[#64748b]">사용률</p>
          <p className="tabular-nums text-3xl font-black" style={{ color }}>
            {usagePct.toFixed(2)}%
          </p>
        </div>
      </div>
      <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-[#f1f5f9]">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.max(usagePct, 2)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="mt-1 flex justify-between text-sm text-[#94a3b8]">
        <span>0</span>
        <span>예산 한도 ({budget} {budgetUnit})</span>
      </div>
      {note && (
        <p className="mt-3 rounded-md bg-[#f8fafc] px-3 py-2 text-sm text-[#64748b]">{note}</p>
      )}
    </div>
  );
}

// ── 섹션 헤더 ─────────────────────────────────────────────────────────────

function RQHeader({
  rq,
  title,
  desc,
  color,
}: {
  rq: string;
  title: string;
  desc: string;
  color: string;
}) {
  return (
    <div className="space-y-2">
      <span
        className="inline-block rounded-md border-2 px-3 py-1 text-xl font-black"
        style={{ borderColor: color, color, backgroundColor: color + "14" }}
      >
        {rq}
      </span>
      <h3 className="text-3xl font-black text-[#111827]">{title}</h3>
      <p className="text-base leading-7 text-[#4b5563]">{desc}</p>
    </div>
  );
}

// ── RQ 핵심 결론 블록 ──────────────────────────────────────────────────────

function RQConclusion({ n, children }: { n: 1 | 2 | 3; children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg border-l-4 bg-[#eff6ff] px-5 py-4"
      style={{ borderColor: semanticColors.brand }}
    >
      <p
        className="text-lg font-black"
        style={{ color: semanticColors.brand }}
      >
        핵심 결론 {n}
      </p>
      <p className="mt-2 text-base font-semibold leading-7 text-[#111827]">{children}</p>
    </div>
  );
}

// ── 페이지 ────────────────────────────────────────────────────────────────

export default function ResultsPage() {
  const tinymlUsagePct = (RT.tinymlActual_us / RT.tinymlBudget_us) * 100;
  const mainLoopUsagePct = (RT.mainLoopActual_ms / RT.mainLoopBudget_ms) * 100;

  // RQ2 답변에서 E3 개선율 계산
  const e3CmVsFixedImprov = Math.round((1 - PAPER_RESULTS.E3.cm.rmse / PAPER_RESULTS.E3.fixed.rmse) * 1000) / 10;

  return (
    <div className="space-y-10">
      {/* 헤더 */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p
          className="text-base font-bold uppercase tracking-[0.14em]"
          style={{ color: semanticColors.brand }}
        >
          Research Results
        </p>
        <h2 className="mt-2 text-3xl font-black text-[#111827]">연구 질문별 결과</h2>
        <p className="mt-2 text-base text-[#64748b]">
          논문 5.2절 RQ1~RQ3 결과 요약. 모든 수치는 논문 확정값.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { href: "#rq1", label: "RQ1 실시간성",   sub: `TinyML 추론 ${RT.tinymlActual_us} µs` },
            { href: "#rq2", label: "RQ2 적응 필터",  sub: "CM-AKF 개선 구간 강조" },
            { href: "#rq3", label: "RQ3 TinyML 대안성", sub: "온디바이스 R̂ 추론 비교" },
          ].map(({ href, label, sub }) => (
            <a
              key={href}
              href={href}
              className="block rounded-lg border border-[#d9e0ea] bg-white p-4 transition hover:border-[#1f4f8f] hover:bg-[#eff6ff]"
            >
              <p className="text-base font-bold" style={{ color: semanticColors.brand }}>{label}</p>
              <p className="mt-1 text-sm font-semibold text-[#475569]">{sub}</p>
              <p className="mt-1 text-xs text-[#94a3b8]">↓ 바로 이동</p>
            </a>
          ))}
        </div>
      </section>

      {/* ── RQ1 ──────────────────────────────────────────────────────────── */}
      <section id="rq1" className="space-y-4 scroll-mt-8">
        <RQHeader
          rq="RQ1"
          title="TinyML-AKF는 MCU에서 실시간 실행 가능한가?"
          desc={`STM32F446RE 200Hz 루프 예산 내 TinyML 추론 실시간성 검증. 실측은 E4 정적 실험(30분, ${E4data.totalLoopCount.toLocaleString()} 루프) 기준.`}
          color={semanticColors.brand}
        />

        <div
          className="rounded-md border px-4 py-2 text-xs font-semibold"
          style={{
            borderColor: "#c7d2fe",
            backgroundColor: "#eef2ff",
            color: semanticColors.brand,
          }}
        >
          DWT 사이클 카운터 기준. {RT.dwtCycles.toLocaleString()} cycles @ {RT.cpuFreqMHz} MHz = {RT.dwtToMs} ms.
          측정 횟수: {E4data.tinymlInferCount.toLocaleString()}회.
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
            color={semanticColors.brand}
            note={`최대 ${E4data.tinymlInferMax_us} µs · std ${E4data.tinymlInferStd_us} µs · ${E4data.tinymlInferCount.toLocaleString()}회 측정`}
          />
          <GaugeSection
            title="메인 루프 실행 시간"
            subtitle="ToF 읽기 + 칼만 필터 + TinyML 포함 전체 루프"
            actual={RT.mainLoopActual_ms}
            actualUnit="ms"
            budget={RT.mainLoopBudget_ms}
            budgetUnit="ms"
            usagePct={mainLoopUsagePct}
            color={semanticColors.brand}
            note={`최대 ${E4data.mainLoopMax_ms} ms · 오버런 ${RT.overrunCount}/${RT.totalCycles.toLocaleString()} (0%)`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
            <p className="text-base font-bold" style={{ color: semanticColors.brand }}>TinyML 여유 마진</p>
            <p className="tabular-nums mt-2 text-4xl font-black" style={{ color: semanticColors.brand }}>
              {RT.tinymlMarginX}×
            </p>
            <p className="mt-1 text-sm text-[#64748b]">
              {RT.tinymlBudget_us.toLocaleString()} µs ÷ {RT.tinymlActual_us} µs
            </p>
          </div>
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
            <p className="text-base font-bold" style={{ color: semanticColors.brand }}>오버런 횟수</p>
            <p className="tabular-nums mt-2 text-4xl font-black" style={{ color: semanticColors.brand }}>
              {RT.overrunCount}
            </p>
            <p className="mt-1 text-sm text-[#4b5563]">
              / {RT.totalCycles.toLocaleString()} 루프 (0%)
            </p>
          </div>
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
            <p className="text-base font-bold" style={{ color: semanticColors.brand }}>루프 사용률</p>
            <p className="tabular-nums mt-2 text-4xl font-black" style={{ color: semanticColors.brand }}>
              {RT.mainLoopUsage}%
            </p>
            <p className="mt-1 text-sm text-[#64748b]">
              {RT.mainLoopActual_ms} ms / {RT.mainLoopBudget_ms} ms 예산
            </p>
          </div>
        </div>

        <div className="rounded-md border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-xs font-semibold text-[#78350f]">
          ⚠ {RT.note}
        </div>

        <RQConclusion n={1}>
          TinyML-AKF는 STM32F446RE 200Hz 루프에서 실시간 실행 가능하다.
          평균 추론 {RT.tinymlActual_us}µs — 예산({RT.tinymlBudget_us}µs) 대비{" "}
          {RT.tinymlMarginX}× 여유 확보.{" "}
          {E4data.tinymlInferCount.toLocaleString()}회 전 측정 오버런 0건,
          메인 루프 사용률 {RT.mainLoopUsage}%로 실시간 안정성 입증.
        </RQConclusion>
      </section>

      {/* ── RQ2 ──────────────────────────────────────────────────────────── */}
      <section id="rq2" className="space-y-4 scroll-mt-8">
        <RQHeader
          rq="RQ2"
          title="노이즈 변화 환경에서 적응 필터가 Fixed KF보다 정확한가?"
          desc="E2(벽 재질별) · E3(ToF 차단) · E5(미지 표면) 시나리오 RMSE 비교. CM-AKF와 TinyML-AKF 개선율 포함."
          color={semanticColors.brand}
        />

        <div className="overflow-x-auto rounded-lg border border-[#d9e0ea] bg-white shadow-sm">
          <table className="min-w-full text-base">
            <thead className="bg-[#f8fafc]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#475569]">시나리오</th>
                <th className="px-4 py-3 text-right font-semibold" style={{ color: ALGO_COLORS.fixed }}>Fixed KF</th>
                <th className="px-4 py-3 text-right font-semibold" style={{ color: ALGO_COLORS.cm }}>CM-AKF</th>
                <th className="px-4 py-3 text-right font-semibold" style={{ color: ALGO_COLORS.cm }}>개선율 (CM)</th>
                <th className="px-4 py-3 text-right font-semibold" style={{ color: ALGO_COLORS.tinyml }}>TinyML-AKF</th>
                <th className="px-4 py-3 text-right font-semibold" style={{ color: ALGO_COLORS.tinyml }}>개선율 (TinyML)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {[
                { label: "E2 흰 우드락",    fixed: PAPER_RESULTS.E2.surfaces.white.fixed.rmse, cm: PAPER_RESULTS.E2.surfaces.white.cm.rmse,  tinyml: PAPER_RESULTS.E2.surfaces.white.tinyml.rmse },
                { label: "E2 검정 우드락",  fixed: PAPER_RESULTS.E2.surfaces.black.fixed.rmse, cm: PAPER_RESULTS.E2.surfaces.black.cm.rmse,  tinyml: PAPER_RESULTS.E2.surfaces.black.tinyml.rmse },
                { label: "E2 투명 아크릴",  fixed: PAPER_RESULTS.E2.surfaces.acryl.fixed.rmse, cm: PAPER_RESULTS.E2.surfaces.acryl.cm.rmse,  tinyml: PAPER_RESULTS.E2.surfaces.acryl.tinyml.rmse },
                { label: "E3 ToF 차단",     fixed: PAPER_RESULTS.E3.fixed.rmse,                cm: PAPER_RESULTS.E3.cm.rmse,                 tinyml: PAPER_RESULTS.E3.tinyml.rmse },
                { label: "E5 미지 표면",    fixed: PAPER_RESULTS.E5.fixed.rmse,                cm: PAPER_RESULTS.E5.cm.rmse,                 tinyml: PAPER_RESULTS.E5.tinyml.rmse },
              ].map(({ label, fixed, cm, tinyml }) => {
                const cmImprov = (((fixed - cm) / fixed) * 100).toFixed(1);
                const tmlImprov = (((fixed - tinyml) / fixed) * 100).toFixed(1);
                const cmPositive = cm < fixed;
                const tmlPositive = tinyml < fixed;
                return (
                  <tr key={label}>
                    <td className="px-4 py-3 font-medium text-[#111827]">{label}</td>
                    <td className="tabular-nums px-4 py-3 text-right text-[#111827]">
                      {fixed.toFixed(2)} mm
                    </td>
                    <td className="tabular-nums px-4 py-3 text-right text-[#111827]">
                      {cm.toFixed(2)} mm
                    </td>
                    <td className="tabular-nums px-4 py-3 text-right font-semibold bg-[#FFF7ED]">
                      <span style={{ color: cmPositive ? "#C2410C" : semanticColors.warning }}>
                        {cmPositive ? "↓" : "↑"} {Math.abs(parseFloat(cmImprov)).toFixed(1)}%
                      </span>
                    </td>
                    <td className="tabular-nums px-4 py-3 text-right text-[#111827]">
                      {tinyml.toFixed(2)} mm
                    </td>
                    <td className="tabular-nums px-4 py-3 text-right font-semibold bg-[#F5F3FF]">
                      <span style={{ color: tmlPositive ? "#5b21b6" : semanticColors.warning }}>
                        {tmlPositive ? "↓" : "↑"} {Math.abs(parseFloat(tmlImprov)).toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#94a3b8]">
          단위: mm (RMSE). 개선율 = (Fixed KF − Adaptive) / Fixed KF × 100.{" "}
          <span className="inline-block rounded px-1" style={{ background: "#FFF7ED" }}>연주황</span> = CM-AKF 개선율,{" "}
          <span className="inline-block rounded px-1" style={{ background: "#F5F3FF" }}>연보라</span> = TinyML-AKF 개선율. ↓ = 개선, ↑ = 저하.
        </p>

        <RQConclusion n={2}>
          CM-AKF와 TinyML-AKF 모두 Fixed KF 대비 노이즈 변화 환경에서 정확도가 우수하다.
          E3 ToF 차단 구간: CM-AKF RMSE {PAPER_RESULTS.E3.cm.rmse}mm —
          Fixed KF {PAPER_RESULTS.E3.fixed.rmse}mm 대비 {e3CmVsFixedImprov}% 감소.
          단, E2 아크릴에서는 예외적으로 TinyML-AKF가 더 낮은 RMSE 달성.
        </RQConclusion>
      </section>

      {/* ── RQ3 ──────────────────────────────────────────────────────────── */}
      <section id="rq3" className="space-y-4 scroll-mt-8">
        <RQHeader
          rq="RQ3"
          title="TinyML-AKF는 CM-AKF의 실용적 대안인가?"
          desc="온디바이스 R̂ 추론 기반 TinyML-AKF와 CM-AKF의 시나리오별 RMSE 비교."
          color={semanticColors.brand}
        />

        {/* CM vs TinyML 직접 비교 */}
        <div className="overflow-x-auto rounded-lg border border-[#d9e0ea] bg-white shadow-sm">
          <table className="min-w-full text-base">
            <thead className="bg-[#f8fafc]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#475569]">시나리오</th>
                <th className="px-4 py-3 text-right font-semibold" style={{ color: ALGO_COLORS.cm }}>CM-AKF</th>
                <th className="px-4 py-3 text-right font-semibold" style={{ color: ALGO_COLORS.tinyml }}>TinyML-AKF</th>
                <th className="px-4 py-3 text-right font-semibold text-[#475569]">차이</th>
                <th className="px-4 py-3 text-left font-semibold text-[#475569]">특이사항</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {[
                { label: "E1 정상 baseline",   cm: PAPER_RESULTS.E1.cm.rmse,                  tinyml: PAPER_RESULTS.E1.tinyml.rmse,                  note: "—",                                                    star: false },
                { label: "E2 흰 우드락",        cm: PAPER_RESULTS.E2.surfaces.white.cm.rmse,   tinyml: PAPER_RESULTS.E2.surfaces.white.tinyml.rmse,   note: "CM 우세",                                              star: false },
                { label: "E2 검정 우드락",      cm: PAPER_RESULTS.E2.surfaces.black.cm.rmse,   tinyml: PAPER_RESULTS.E2.surfaces.black.tinyml.rmse,   note: "CM 우세",                                              star: false },
                { label: "E2 투명 아크릴",      cm: PAPER_RESULTS.E2.surfaces.acryl.cm.rmse,   tinyml: PAPER_RESULTS.E2.surfaces.acryl.tinyml.rmse,   note: "TinyML Best",                                          star: true  },
                { label: "E3 ToF 차단",         cm: PAPER_RESULTS.E3.cm.rmse,                  tinyml: PAPER_RESULTS.E3.tinyml.rmse,                  note: `TinyML R̂ 회복 ${PAPER_RESULTS.E3.recoverySpeedup}× 빠름`, star: false },
                { label: "E4 정적 안정성",      cm: PAPER_RESULTS.E4.cm.rmse,                  tinyml: PAPER_RESULTS.E4.tinyml.rmse,                  note: "거의 동등",                                             star: false },
                { label: "E5 미지 표면",         cm: PAPER_RESULTS.E5.cm.rmse,                  tinyml: PAPER_RESULTS.E5.tinyml.rmse,                  note: "CM 우세, 일반화 한계",                                   star: false },
              ].map(({ label, cm, tinyml, note, star }) => {
                const diff = tinyml - cm;
                const diffStr = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
                const isBetter = tinyml < cm;
                const diffColor = isBetter ? semanticColors.positive : diff > 1 ? semanticColors.warning : semanticColors.muted;
                return (
                  <tr key={label} style={star ? { backgroundColor: "#fef2f2" } : undefined}>
                    <td className="px-4 py-3 font-medium text-[#111827]">
                      {label}
                      {star && (
                        <span className="ml-1.5 font-black" style={{ color: semanticColors.danger }}>★</span>
                      )}
                    </td>
                    <td className="tabular-nums px-4 py-3 text-right font-semibold" style={{ color: ALGO_COLORS.cm }}>
                      {cm.toFixed(2)} mm
                    </td>
                    <td className="tabular-nums px-4 py-3 text-right font-semibold" style={{ color: ALGO_COLORS.tinyml }}>
                      {tinyml.toFixed(2)} mm
                    </td>
                    <td className="tabular-nums px-4 py-3 text-right font-semibold" style={{ color: diffColor }}>
                      {diffStr} mm
                    </td>
                    <td
                      className="px-4 py-3 text-xs font-semibold"
                      style={{ color: star ? semanticColors.danger : "#64748b" }}
                    >
                      {note}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-[#94a3b8]">
          <span style={{ color: semanticColors.danger }} className="font-bold">★</span>{" "}
          E2 아크릴: 유일하게 TinyML-AKF가 CM-AKF보다 낮은 RMSE. 아크릴 고유 반사 패턴이 6-feature 모델에 유리하게 작용.
          E3: RMSE는 CM이 낮지만 TinyML이 R̂ 회복 {PAPER_RESULTS.E3.recoverySpeedup}× 빠름
          ({PAPER_RESULTS.E3.recoveryTimeCM_ms}ms → {PAPER_RESULTS.E3.recoveryTimeTinyML_ms}ms).
        </p>

        {/* 표 5-2 — 시나리오별 알고리즘 RMSE 종합 */}
        <div className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
          <p
            className="text-base font-bold"
            style={{ color: semanticColors.brand }}
          >
            시나리오별 알고리즘 RMSE 종합 (논문 표 5-2)
          </p>
          <p className="mt-1 text-xs text-[#94a3b8]">
            논문 확정 수치. TinyML NIS는 innovation_cov 미제공으로 항상 —.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold text-[#475569]">시나리오</th>
                  <th className="px-4 py-2.5 text-right font-semibold" style={{ color: ALGO_COLORS.raw }}>Raw</th>
                  <th className="px-4 py-2.5 text-right font-semibold" style={{ color: ALGO_COLORS.fixed }}>Fixed KF</th>
                  <th className="px-4 py-2.5 text-right font-semibold" style={{ color: ALGO_COLORS.cm }}>CM-AKF</th>
                  <th className="px-4 py-2.5 text-right font-semibold" style={{ color: ALGO_COLORS.tinyml }}>TinyML-AKF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                <tr>
                  <td className="px-4 py-2.5 font-medium text-[#111827]">E1 — 정상 baseline</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E1.raw.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E1.fixed.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right font-semibold text-[#111827]">{PAPER_RESULTS.E1.cm.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E1.tinyml.rmse}</td>
                </tr>
                <tr className="bg-[#fafafa]">
                  <td className="px-4 py-2.5 text-[#475569]">E2 — 흰 우드락</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E2.surfaces.white.raw.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E2.surfaces.white.fixed.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right font-semibold text-[#111827]">{PAPER_RESULTS.E2.surfaces.white.cm.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E2.surfaces.white.tinyml.rmse}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-[#475569]">E2 — 검정 우드락</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E2.surfaces.black.raw.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E2.surfaces.black.fixed.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right font-semibold text-[#111827]">{PAPER_RESULTS.E2.surfaces.black.cm.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E2.surfaces.black.tinyml.rmse}</td>
                </tr>
                <tr style={{ backgroundColor: "#fef2f2" }}>
                  <td className="px-4 py-2.5 text-[#475569]">
                    E2 — 투명 아크릴
                    <span
                      className="ml-1.5 text-xs font-black"
                      style={{ color: semanticColors.danger }}
                    >
                      ★TinyML Best
                    </span>
                  </td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E2.surfaces.acryl.raw.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E2.surfaces.acryl.fixed.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E2.surfaces.acryl.cm.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right font-semibold text-[#111827]">{PAPER_RESULTS.E2.surfaces.acryl.tinyml.rmse}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 font-medium text-[#111827]">E3 — ToF 차단 구간</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E3.raw.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E3.fixed.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right font-semibold text-[#111827]">{PAPER_RESULTS.E3.cm.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E3.tinyml.rmse}</td>
                </tr>
                <tr className="bg-[#fafafa]">
                  <td className="px-4 py-2.5 text-[#475569]">E4 — 정적 장기 안정성</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E4.raw.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E4.fixed.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right font-semibold text-[#111827]">{PAPER_RESULTS.E4.cm.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E4.tinyml.rmse}</td>
                </tr>
                <tr>
                  <td className="px-4 py-2.5 text-[#475569]">E5 — 미지 표면 일반화</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E5.raw.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E5.fixed.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right font-semibold text-[#111827]">{PAPER_RESULTS.E5.cm.rmse}</td>
                  <td className="tabular-nums px-4 py-2.5 text-right text-[#111827]">{PAPER_RESULTS.E5.tinyml.rmse}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-[#94a3b8]">
            단위: mm (RMSE). CM-AKF = Covariance-Matching AKF. TinyML-AKF = 온-디바이스 R̂ 추론.
            E3 TinyML {PAPER_RESULTS.E3.recoverySpeedup}× 빠른 R̂ 회복 ({PAPER_RESULTS.E3.recoveryTimeCM_ms}ms → {PAPER_RESULTS.E3.recoveryTimeTinyML_ms}ms).
          </p>
        </div>

        <RQConclusion n={3}>
          TinyML-AKF는 CM-AKF의 실용적 대안 가능성을 보이나 완전한 대체는 어렵다.
          E2 아크릴에서 유일하게 CM-AKF 대비 낮은 RMSE 달성,
          E3 ToF 차단 해제 후 R̂ 회복 {PAPER_RESULTS.E3.recoverySpeedup}× 빠름(
          {PAPER_RESULTS.E3.recoveryTimeCM_ms}ms → {PAPER_RESULTS.E3.recoveryTimeTinyML_ms}ms).
          단, 3-feature 모델은 고반사 표면에서 RMSE 97mm 폭발 —{" "}
          6-feature 모델 채택이 실용화의 필수 조건.
        </RQConclusion>
      </section>
    </div>
  );
}
