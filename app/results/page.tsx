import { PAPER_RESULTS } from "@/lib/paper-results";
import { ALGO_COLORS, semanticColors } from "@/lib/palette";

const RT = PAPER_RESULTS.realtime;
const E4data = PAPER_RESULTS.E4;
const E3_RECOVERY_SPEEDUP_TEXT = "약 2.7";

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
    <div className="rounded-lg border border-[#d9e0ea] bg-white p-6 text-center shadow-sm">
      <p className="text-xl font-bold text-[#111827]">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-[#94a3b8]">{subtitle}</p>}
      <div className="mt-4 grid grid-cols-3 items-end gap-4 text-center">
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
  const mainLoopUsagePct = RT.mainLoopUsage;

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
            { href: "#rq1", label: "RQ1 실시간성",         sub: `TinyML 추론 ${RT.tinymlActual_us} µs` },
            { href: "#rq2", label: "RQ2 측정 노이즈 적응성", sub: "E2·E3·E5 위치 RMSE · R̂ 회복" },
            { href: "#rq3", label: "RQ3 다변량 feature 활용", sub: "선행 변화 · Ablation 연결" },
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
            subtitle="ToF 읽기 + 칼만 필터 + TinyML 포함. 전체 5 ms 중 4.5 ms overrun margin 기준"
            actual={RT.mainLoopActual_ms}
            actualUnit="ms"
            budget={RT.mainLoopMargin_ms}
            budgetUnit="ms"
            usagePct={mainLoopUsagePct}
            color={semanticColors.brand}
            note={`최대 ${E4data.mainLoopMax_ms} ms · 오버런 ${RT.overrunCount}/${RT.totalCycles.toLocaleString()} (0%)`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 text-center shadow-sm">
            <p className="text-base font-bold" style={{ color: semanticColors.brand }}>TinyML 여유 마진</p>
            <p className="tabular-nums mt-2 text-4xl font-black" style={{ color: semanticColors.brand }}>
              {RT.tinymlMarginX}×
            </p>
            <p className="mt-1 text-sm text-[#64748b]">
              {RT.tinymlBudget_us.toLocaleString()} µs ÷ {RT.tinymlActual_us} µs
            </p>
          </div>
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 text-center shadow-sm">
            <p className="text-base font-bold" style={{ color: semanticColors.brand }}>오버런 횟수</p>
            <p className="tabular-nums mt-2 text-4xl font-black" style={{ color: semanticColors.brand }}>
              {RT.overrunCount}
            </p>
            <p className="mt-1 text-sm text-[#4b5563]">
              / {RT.totalCycles.toLocaleString()} 루프 (0%)
            </p>
          </div>
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 text-center shadow-sm">
            <p className="text-base font-bold" style={{ color: semanticColors.brand }}>루프 사용률</p>
            <p className="tabular-nums mt-2 text-4xl font-black" style={{ color: semanticColors.brand }}>
              {RT.mainLoopUsage}%
            </p>
            <p className="mt-1 text-sm text-[#64748b]">
              {RT.mainLoopActual_ms} ms / {RT.mainLoopMargin_ms} ms margin
            </p>
          </div>
        </div>

        <div className="rounded-md border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-xs font-semibold text-[#78350f]">
          ⚠ {RT.note}
        </div>

        <RQConclusion n={1}>
          TinyML-AKF는 STM32F446RE 200Hz 루프에서 실시간 실행 가능
          <br />
          평균 추론 {RT.tinymlActual_us}µs — 예산({RT.tinymlBudget_us}µs) 대비 {RT.tinymlMarginX}× 여유 확보
          <br />
          {E4data.tinymlInferCount.toLocaleString()}회 전 측정 오버런 0건
          <br />
          메인 루프는 4.5 ms overrun margin 기준 {RT.mainLoopUsage}%에서 안정적 동작
        </RQConclusion>
      </section>

      {/* ── RQ2 ──────────────────────────────────────────────────────────── */}
      <section id="rq2" className="space-y-4 scroll-mt-8">
        <RQHeader
          rq="RQ2"
          title="TinyML-AKF는 CM-AKF 대비, 복합 노이즈 환경에서 어떠한 차이를 보이는가?"
          desc="E2 9 run · E3 5 run · E5 5 run에서 위치 RMSE와 R̂ 회복 동역학 비교. 복합 노이즈가 존재하는 시나리오에서 두 적응 필터의 정확도와 R 추정 거동 차이를 정량화."
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
          위치 RMSE 기준으로 TinyML-AKF는 CM-AKF와 대체로 동등
          <br />
          - E2 흰·검정 우드락: CM-AKF보다 약 1~1.4 mm 높은 RMSE를 보임
          <br />
          - 반면 R 추정 거동 측면: 차단 이탈 후 회복 속도가 CM-AKF 대비 약 2.7배 빠른 차별적 특성
          <br />
          다만 본 실험 조건에서는 R̂ 회복 속도 차이가 위치 RMSE로 누적되지 않음
          <br />
          두 알고리즘 모두 Fixed KF 대비 모든 시나리오에서 우위를 보임
        </RQConclusion>
      </section>

      {/* ── RQ3 ──────────────────────────────────────────────────────────── */}
      <section id="rq3" className="space-y-4 scroll-mt-8">
        <RQHeader
          rq="RQ3"
          title="다변량 feature 활용은 잔차 통계 단일 기법 대비 어떤 이점을 제공하는가?"
          desc="E3 차단 이탈 후 R̂ 회복 동역학, F6 signal_rate 선행 변화, 3-feature ablation 결과로 다변량 feature 기여를 세 가지 증거로 정량화."
          color={semanticColors.brand}
        />

        {/* ── 증거 3개 카드 ─────────────────────────────────────────── */}
        <div className="grid gap-4 lg:grid-cols-3">
          {/* 증거 1: R̂ 회복 동역학 */}
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: semanticColors.brand }}>증거 ①</p>
            <p className="mt-1 text-base font-black text-[#111827]">R̂ 회복 동역학</p>
            <p className="mt-3 tabular-nums text-4xl font-black" style={{ color: semanticColors.brand }}>
              {E3_RECOVERY_SPEEDUP_TEXT}×
            </p>
            <p className="mt-1 text-sm font-semibold text-[#475569]">빠른 R̂ 회복</p>
            <p className="mt-2 text-xs leading-5 text-[#64748b]">
              E3 차단 이탈 후 CM-AKF {PAPER_RESULTS.E3.recoveryTimeCM_ms} ms →
              TinyML-AKF {PAPER_RESULTS.E3.recoveryTimeTinyML_ms} ms.
              점진 감소 패턴은 잔차 단일 통계만으로 산출 불가능.
            </p>
          </div>

          {/* 증거 2: F6 선행 변화 */}
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: semanticColors.brand }}>증거 ②</p>
            <p className="mt-1 text-base font-black text-[#111827]">F6 signal_rate 선행 반응</p>
            <p className="mt-3 tabular-nums text-4xl font-black" style={{ color: semanticColors.brand }}>
              80 ms
            </p>
            <p className="mt-1 text-sm font-semibold text-[#475569]">차단 진입보다 먼저 반응</p>
            <p className="mt-2 text-xs leading-5 text-[#64748b]">
              E3 run03: F6가 차단 진입 시점보다 4 frame (80 ms) 먼저 baseline ±3σ 이탈.
              F1 residual · F4 sensor_disagreement는 차단 진입 시점에 비로소 반응.
            </p>
          </div>

          {/* 증거 3: Ablation */}
          <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: semanticColors.danger }}>증거 ③</p>
            <p className="mt-1 text-base font-black text-[#111827]">3-feature Ablation</p>
            <p className="mt-3 tabular-nums text-4xl font-black" style={{ color: semanticColors.danger }}>
              97.00 mm*
            </p>
            <p className="mt-1 text-sm font-semibold text-[#475569]">E2 아크릴 hold-out RMSE</p>
            <p className="mt-2 text-xs leading-5 text-[#64748b]">
              E2 아크릴 조건에서 3-feature 모델의 상대 성능 열화가 관찰됨.
              *1차 측정 데이터 기반 PC 사후추론 결과이며, 절대값보다 CM-AKF 대비 차이 중심으로 해석.
            </p>
          </div>
        </div>

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
                { label: "E2 투명 아크릴",      cm: PAPER_RESULTS.E2.surfaces.acryl.cm.rmse,   tinyml: PAPER_RESULTS.E2.surfaces.acryl.tinyml.rmse,   note: "근소한 TinyML 우세",                                    star: true  },
                { label: "E3 ToF 차단",         cm: PAPER_RESULTS.E3.cm.rmse,                  tinyml: PAPER_RESULTS.E3.tinyml.rmse,                  note: `TinyML R̂ 회복 ${E3_RECOVERY_SPEEDUP_TEXT}× 빠름`, star: false },
                { label: "E4 정적 안정성",      cm: PAPER_RESULTS.E4.cm.rmse,                  tinyml: PAPER_RESULTS.E4.tinyml.rmse,                  note: "거의 동등",                                             star: false },
                { label: "E5 미지 표면",         cm: PAPER_RESULTS.E5.cm.rmse,                  tinyml: PAPER_RESULTS.E5.tinyml.rmse,                  note: "거의 동등, 발산 없음",                                   star: false },
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
          E2 아크릴: TinyML-AKF가 CM-AKF보다 근소하게 낮은 RMSE를 보였으나, 차이는 약 0.21 mm로 거의 동등.
          E3: RMSE는 CM이 낮지만 TinyML이 R̂ 회복 {E3_RECOVERY_SPEEDUP_TEXT}× 빠름
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
                      근소한 TinyML 우세
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
            E3 TinyML {E3_RECOVERY_SPEEDUP_TEXT}× 빠른 R̂ 회복 ({PAPER_RESULTS.E3.recoveryTimeCM_ms}ms → {PAPER_RESULTS.E3.recoveryTimeTinyML_ms}ms).
          </p>
        </div>

        <RQConclusion n={3}>
          세 가지 결과는 다변량 feature가 잔차 통계 단일 기법의 한계를 보완할 수 있음을 정량적으로 뒷받침 가능
          <br />
          (1) E3 차단 이탈 후 TinyML R̂의 점진 감소 패턴이 잔차 단일 통계만으로 산출 불가능 — 회복 속도 2.67×(160ms → 60ms)
          <br />
          (2) F6 signal_rate가 차단 진입 시점보다 4 frame (80 ms) 먼저 baseline ±3σ 이탈하는 선행 지표 특성
          <br />
          (3) 3-feature ablation에서 E2 투명 아크릴·E3의 성능 열화가 관찰
          <br />
          → F4 sensor_disagreement와 F6 signal_rate 등 잔차 외 feature의 보완 필요성 확인
          <br />
          단, 본 학습 데이터에서 F4·F6 추가의 R̂ MAE 우위는 제한적
        </RQConclusion>
      </section>
    </div>
  );
}
