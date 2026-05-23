import { PAPER_RESULTS } from "@/lib/paper-results";

const RT = PAPER_RESULTS.realtime;
const E4 = PAPER_RESULTS.E4;

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

      {/* Progress bar */}
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

export default function RealtimePage() {
  const tinymlUsagePct = (RT.tinymlActual_us / RT.tinymlBudget_us) * 100;
  const mainLoopUsagePct = (RT.mainLoopActual_ms / RT.mainLoopBudget_ms) * 100;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">Realtime</p>
        <h2 className="mt-3 text-2xl font-semibold text-[#111827]">실시간 성능 — 논문 5.2.1 RQ1</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#475569]">
          STM32F446RE MCU 온보드 TinyML 추론 및 200Hz 메인 루프 실시간성 검증.
          실측값은 E4 정적 실험(30분, {E4.totalLoopCount.toLocaleString()} 루프) 기준.
        </p>
        <div className="mt-3 rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-xs text-[#1e40af]">
          DWT 사이클 카운터 기준. {RT.dwtCycles.toLocaleString()} cycles @ {RT.cpuFreqMHz} MHz = {RT.dwtToMs} ms.
          측정 횟수: {E4.tinymlInferCount.toLocaleString()}회.
        </div>
      </section>

      {/* TinyML 추론 게이지 */}
      <GaugeSection
        title="TinyML 추론 시간"
        subtitle="STM32F446RE 온보드 INT8 양자화 모델 (6-feature, 목표 <0.5 ms)"
        actual={RT.tinymlActual_us}
        actualUnit="µs"
        budget={RT.tinymlBudget_us}
        budgetUnit="µs"
        usagePct={tinymlUsagePct}
        color="#7c3aed"
        note={`최대 ${E4.tinymlInferMax_us} µs · std ${E4.tinymlInferStd_us} µs · ${E4.tinymlInferCount.toLocaleString()}회 측정`}
      />

      {/* 메인 루프 게이지 */}
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

      {/* 마진 강조 카드 */}
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-[#ede9fe] bg-[#faf5ff] p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#7c3aed]">TinyML 여유 마진</p>
          <p className="mt-2 text-3xl font-bold text-[#6d28d9]">{RT.tinymlMarginX}×</p>
          <p className="mt-1 text-xs text-[#a78bfa]">
            {RT.tinymlBudget_us.toLocaleString()} µs ÷ {RT.tinymlActual_us} µs
          </p>
        </div>
        <div className="rounded-lg border border-[#d1fae5] bg-[#f0fdf4] p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#10b981]">오버런 횟수</p>
          <p className="mt-2 text-3xl font-bold text-[#047857]">
            {RT.overrunCount}
          </p>
          <p className="mt-1 text-xs text-[#6ee7b7]">
            / {RT.totalCycles.toLocaleString()} 루프 (0%)
          </p>
        </div>
        <div className="rounded-lg border border-[#dbeafe] bg-[#eff6ff] p-5 shadow-sm">
          <p className="text-xs font-semibold text-[#2563eb]">루프 사용률</p>
          <p className="mt-2 text-3xl font-bold text-[#1d4ed8]">
            {RT.mainLoopUsage}%
          </p>
          <p className="mt-1 text-xs text-[#93c5fd]">
            {RT.mainLoopActual_ms} ms / {RT.mainLoopBudget_ms} ms 예산
          </p>
        </div>
      </section>

      {/* DWT → 시간 변환 */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-[#111827]">DWT 사이클 → 시간 변환</h3>
        <div className="mt-3 rounded-md bg-[#f8fafc] p-4 font-mono text-sm text-[#475569]">
          <p>{RT.dwtCycles.toLocaleString()} cycles ÷ ({RT.cpuFreqMHz} MHz × 10⁶) = {RT.dwtToMs} ms</p>
          <p className="mt-1 text-xs text-[#94a3b8]">STM32F446RE CPU 클록 {RT.cpuFreqMHz} MHz 기준</p>
        </div>
        <p className="mt-2 text-xs text-[#94a3b8]">
          DWT(Data Watchpoint and Trace) 카운터로 실제 MCU 사이클을 측정. 인터럽트 지연 제외.
        </p>
      </section>

      {/* 한계 주석 */}
      <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-xs text-[#64748b]">
        ⚠️ {RT.note}
      </div>
    </div>
  );
}
