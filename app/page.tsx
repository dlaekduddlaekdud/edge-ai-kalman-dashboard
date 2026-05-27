import Link from "next/link";
import { PAPER_RESULTS } from "@/lib/paper-results";

const NAVY = "#1E3A8A";

const totalFrames =
  PAPER_RESULTS.E1.totalFrames +
  PAPER_RESULTS.E2.surfaces.white.totalFrames +
  PAPER_RESULTS.E2.surfaces.black.totalFrames +
  PAPER_RESULTS.E2.surfaces.acryl.totalFrames +
  PAPER_RESULTS.E3.totalFrames +
  PAPER_RESULTS.E4.totalFrames +
  PAPER_RESULTS.E5.totalFrames;

const KPI_CARDS = [
  {
    label: "E3 차단 구간 개선",
    value: "적응형 R",
    color: NAVY,
    sub: "Fixed KF 한계 확인",
    detail: "Fixed KF의 한계 확인, CM-AKF·TinyML-AKF 모두 적응형 R 조정으로 위치 오차 감소",
  },
  {
    label: "TinyML 추론 마진",
    value: `${PAPER_RESULTS.realtime.tinymlMarginX}×`,
    color: NAVY,
    sub: `${PAPER_RESULTS.realtime.tinymlActual_us} µs / ${PAPER_RESULTS.realtime.tinymlBudget_us} µs 목표`,
    detail: "TinyML 추론 목표 500 µs 대비 실측 평균 추론 시간 여유 (메인 루프 오버런 0건)",
  },
  {
    label: "총 실험 프레임",
    value: totalFrames.toLocaleString(),
    color: NAVY,
    sub: `E1~E5 전체 · ${[
      `E1×${PAPER_RESULTS.E1.runs}`,
      `E3×${PAPER_RESULTS.E3.runs}`,
      `E4×${PAPER_RESULTS.E4.runs}`,
    ].join(", ")} 포함`,
    detail: "STM32에서 수집·필터링된 전체 센서 프레임 수",
  },
  {
    label: "E3 R̂ 회복 배속",
    value: "약 2.7×",
    color: NAVY,
    sub: `CM-AKF ${PAPER_RESULTS.E3.recoveryTimeCM_ms} ms → TinyML-AKF ${PAPER_RESULTS.E3.recoveryTimeTinyML_ms} ms`,
    detail: "E3 차단 이탈 후 R̂ 회복 시간",
  },
];

const pages = [
  {
    href: "/upload",
    title: "Scenario Dashboard",
    badge: "E1~E5",
    description:
      "시나리오와 표면을 선택하면 내장 실험 CSV를 자동 파싱하고 같은 화면에서 결과 대시보드를 바로 표시합니다.",
  },
  {
    href: "/ablation",
    title: "Ablation",
    badge: "표 4-10 · 5-3",
    description:
      "6-feature / 3-feature TinyML 모델의 R̂ 라벨 추적도와 hold-out RMSE를 비교합니다.",
  },
  {
    href: "/results",
    title: "Results",
    badge: "RQ1~3",
    description:
      "RQ1 실시간성, RQ2 측정 노이즈 적응성, RQ3 다변량 feature 활용의 정당성을 시나리오별 결과로 정리합니다.",
  },
  {
    href: "/method",
    title: "Method",
    badge: "지표 정의",
    description:
      "RMSE, NIS pass rate, RMSEss, Tconv 등 평가 지표의 구현 공식과 논문 매핑을 정리합니다.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="rounded-lg border border-[#d1d5db] bg-white p-8 shadow-sm">
        <p className="text-base font-bold uppercase tracking-[0.14em] text-[#111827]">
          Edge AI Kalman Dashboard
        </p>
        <h2 className="mt-4 max-w-5xl text-4xl font-bold leading-tight text-[#111827]">
          STM32 센서 로그 분석 · TinyML-AKF 실험 시각화 시스템
        </h2>
        <div className="mt-5 max-w-4xl space-y-2 text-lg leading-8 text-[#374151]">
          <p>
            STM32F446RE에서 수집한 VL53L0X ToF, 엔코더, 보조 센서 기반 실험 CSV를 파싱하여 Fixed KF · CM-AKF · TinyML-AKF의 정확도 지표와 TinyML 추론 시간 지표를 논문 정의에 맞춰 분석합니다.
          </p>
          <p>
            CSV 파싱, 지표 계산, 시나리오별 결과 시각화까지 TypeScript로 구현한 재현 가능한 실험 데이터 파이프라인입니다.
          </p>
        </div>
      </section>

      {/* ── KPI 카드 4개 ─────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-4 text-xl font-bold text-[#111827]">
          실험 결과 핵심 지표
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPI_CARDS.map((card) => (
            <div
              key={card.label}
              className="rounded-lg border border-[#d1d5db] bg-[#f3f4f6] p-5 shadow-sm"
            >
              <p className="text-lg font-bold text-[#111827]">
                {card.label}
              </p>
              <p className="mt-2 text-4xl font-black tracking-tight" style={{ color: card.color }}>
                {card.value}
              </p>
              <p className="mt-2 text-base font-semibold text-[#1f2937]">{card.sub}</p>
              <p className="mt-3 text-sm leading-6 text-[#4b5563]">{card.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 페이지 내비게이션 ─────────────────────────────────────────── */}
      <section>
        <h3 className="mb-3 text-lg font-bold text-[#111827]">
          분석 화면
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {pages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="group rounded-lg border border-[#d1d5db] bg-white p-5 shadow-sm transition hover:border-[#111827] hover:bg-[#f9fafb]"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[#111827]">
                  {page.title}
                </h3>
                {page.badge && (
                  <span className="rounded-full border border-[#d1d5db] bg-[#f3f4f6] px-2 py-0.5 text-xs font-semibold text-[#374151]">
                    {page.badge}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm leading-6 text-[#64748b]">
                {page.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 프로젝트 한계 ─────────────────────────────────────────────── */}
      <section className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
          Limitations
        </p>
        <ul className="mt-2 space-y-1 text-xs leading-5 text-[#64748b]">
          <li>• E4 CSV(83k행 × 3)는 번들 크기로 인해 하드코딩 카드로 표시됩니다.</li>
          <li>• E2/E5 뷰는 논문 확정값 기반입니다. 실시간 스트리밍은 미구현 상태입니다.</li>
          <li>• TinyML NIS는 <code className="rounded bg-white px-1">innovation_cov</code> 컬럼이 없어 항상 —로 표시됩니다.</li>
        </ul>
      </section>
    </div>
  );
}
