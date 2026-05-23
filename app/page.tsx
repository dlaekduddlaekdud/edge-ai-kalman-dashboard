import Link from "next/link";
import { PAPER_RESULTS } from "@/lib/paper-results";

// ── 논문 확정값 기반 KPI 계산 ────────────────────────────────────────────
const e3RmseImprovement = Math.round(
  (1 - PAPER_RESULTS.E3.cm.rmse / PAPER_RESULTS.E3.raw.rmse) * 1000,
) / 10; // 70.1%

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
    label: "E3 RMSE 개선",
    value: `${e3RmseImprovement}%`,
    sub: `Raw ${PAPER_RESULTS.E3.raw.rmse} mm → CM-AKF ${PAPER_RESULTS.E3.cm.rmse} mm`,
    detail: "ToF 차단 구간에서 적응형 필터가 고정 파라미터 대비 달성한 오차 감소율",
    color: "#16a34a",
    bg: "#f0fdf4",
    border: "#bbf7d0",
  },
  {
    label: "TinyML 추론 마진",
    value: `${PAPER_RESULTS.realtime.tinymlMarginX}×`,
    sub: `${PAPER_RESULTS.realtime.tinymlActual_us} µs / ${PAPER_RESULTS.realtime.tinymlBudget_us} µs 목표`,
    detail: "200 Hz 루프 500 µs 예산 대비 실측 평균 추론 시간 여유 (오버런 0건)",
    color: "#7c3aed",
    bg: "#faf5ff",
    border: "#ede9fe",
  },
  {
    label: "총 실험 프레임",
    value: totalFrames.toLocaleString(),
    sub: `E1~E5 전체 · ${[
      `E1×${PAPER_RESULTS.E1.runs}`,
      `E3×${PAPER_RESULTS.E3.runs}`,
      `E4×${PAPER_RESULTS.E4.runs}`,
    ].join(", ")} 포함`,
    detail: "STM32에서 수집·필터링된 전체 센서 프레임 수",
    color: "#0369a1",
    bg: "#f0f9ff",
    border: "#bae6fd",
  },
  {
    label: "E3 회복 배속",
    value: `${PAPER_RESULTS.E3.recoverySpeedup}×`,
    sub: `CM ${PAPER_RESULTS.E3.recoveryTimeCM_ms} ms → TinyML ${PAPER_RESULTS.E3.recoveryTimeTinyML_ms} ms`,
    detail: "ToF 차단 해제 후 R̂ 회복 시간 — TinyML-AKF가 CM-AKF보다 빠른 이유",
    color: "#b45309",
    bg: "#fffbeb",
    border: "#fde68a",
  },
];

const pages = [
  {
    href: "/upload",
    title: "CSV Upload",
    badge: "데모 데이터 포함",
    description:
      "실험 CSV를 업로드하거나 내장 데모 데이터를 즉시 로드합니다. 28컬럼 감지 시 TinyML 차트 자동 활성화.",
  },
  {
    href: "/dashboard",
    title: "Scenario Dashboard",
    badge: "E0~E5",
    description:
      "E1/E3는 업로드 CSV 기반 동적 분석, E0/E2/E4/E5는 논문 확정값 카드·표로 제공합니다.",
  },
  {
    href: "/ablation",
    title: "Ablation",
    badge: "표 4-10 · 5-3",
    description:
      "6-feature / 3-feature TinyML 모델의 R̂ 라벨 추적도(MAE_R/MAPE_R)를 비교합니다.",
  },
  {
    href: "/method",
    title: "Method",
    badge: "지표 정의",
    description:
      "RMSE, NIS pass rate, RMSEss, Tconv 등 평가 지표의 구현 공식과 논문 매핑을 정리합니다.",
  },
  {
    href: "/realtime",
    title: "Realtime",
    badge: "200 Hz",
    description:
      "TinyML 35.32 µs 추론 · 200 Hz 루프 실시간성 · 14.2× 여유 마진을 게이지로 시각화합니다.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
          Edge AI Kalman Dashboard
        </p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold text-[#111827]">
          STM32 센서 데이터 파이프라인 · 실시간 시각화 풀스택 시스템
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#475569]">
          STM32F446RE에서 수집한 VL53L1X ToF 센서 데이터를 CSV로 내보내
          Fixed KF · CM-AKF · TinyML-AKF의 정확도와 실시간성 지표를 논문 정의에 맞춰 분석합니다.
          CSV 파싱부터 지표 계산·시각화까지 TypeScript로 구현한 단일 데이터 파이프라인입니다.
        </p>

        {/* 아키텍처 미니 플로우 */}
        <div className="mt-5 flex flex-wrap items-center gap-1.5 text-xs">
          {[
            { label: "STM32F446RE", sub: "200 Hz loop" },
            { label: "CSV Export", sub: "25 / 28 col" },
            { label: "PapaParse", sub: "type-safe 파싱" },
            { label: "Zustand Store", sub: "run-slot 상태" },
            { label: "Metrics Engine", sub: "RMSE·NIS·Tconv" },
            { label: "Recharts", sub: "시계열·비교 차트" },
          ].map((node, i, arr) => (
            <span key={node.label} className="flex items-center gap-1.5">
              <span className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1.5 text-center">
                <span className="block font-semibold text-[#374151]">{node.label}</span>
                <span className="block text-[10px] text-[#94a3b8]">{node.sub}</span>
              </span>
              {i < arr.length - 1 && (
                <span className="text-[#94a3b8]">→</span>
              )}
            </span>
          ))}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-[#1d4ed8]">
            Next.js 15 App Router
          </span>
          <span className="rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1 text-[#15803d]">
            25/28컬럼 dual-schema
          </span>
          <span className="rounded-full border border-[#ede9fe] bg-[#faf5ff] px-3 py-1 text-[#6d28d9]">
            TypeScript strict
          </span>
          <span className="rounded-full border border-[#fde68a] bg-[#fffbeb] px-3 py-1 text-[#92400e]">
            Zustand · Recharts
          </span>
        </div>
      </section>

      {/* ── KPI 카드 4개 ─────────────────────────────────────────────── */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
          실험 결과 핵심 지표
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPI_CARDS.map((card) => (
            <div
              key={card.label}
              className="rounded-lg border p-5 shadow-sm"
              style={{ borderColor: card.border, backgroundColor: card.bg }}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.12em]"
                style={{ color: card.color }}>
                {card.label}
              </p>
              <p className="mt-2 text-4xl font-bold tracking-tight"
                style={{ color: card.color }}>
                {card.value}
              </p>
              <p className="mt-1.5 text-xs font-medium text-[#374151]">{card.sub}</p>
              <p className="mt-2 text-[11px] leading-5 text-[#64748b]">{card.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Quick Start 배너 ─────────────────────────────────────────── */}
      <section className="flex flex-col items-start gap-3 rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#1d4ed8]">바로 시작하기</p>
          <p className="mt-0.5 text-sm text-[#3b82f6]">
            E1 또는 E3 데모 데이터를 즉시 로드해 대시보드를 확인하세요.
            CSV 파일 없이도 모든 기능을 탐색할 수 있습니다.
          </p>
        </div>
        <Link
          href="/upload"
          className="shrink-0 rounded-md bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1d4ed8]"
        >
          데모 데이터 로드 →
        </Link>
      </section>

      {/* ── 페이지 내비게이션 ─────────────────────────────────────────── */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-[#94a3b8]">
          분석 화면
        </h3>
        <div className="grid gap-4 md:grid-cols-2">
          {pages.map((page) => (
            <Link
              key={page.href}
              href={page.href}
              className="group rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm transition hover:border-[#2563eb] hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-[#111827] group-hover:text-[#2563eb]">
                  {page.title}
                </h3>
                {page.badge && (
                  <span className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-2 py-0.5 text-[11px] font-semibold text-[#64748b]">
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
