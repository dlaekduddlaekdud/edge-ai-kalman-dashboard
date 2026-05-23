import Link from "next/link";

const pages = [
  {
    href: "/upload",
    title: "CSV Upload",
    description: "시나리오/run별 25컬럼·28컬럼 CSV를 검증하고 업로드합니다.",
  },
  {
    href: "/dashboard",
    title: "Scenario Dashboard",
    description: "E0~E5 시나리오별 논문 확정값과 업로드 CSV 계산값을 확인합니다.",
  },
  {
    href: "/ablation",
    title: "Ablation",
    description: "6-feature와 3-feature TinyML 모델의 R̂ 라벨 추적도를 비교합니다.",
  },
  {
    href: "/method",
    title: "Method",
    description: "RMSE, NIS, RMSEss, Tconv 등 논문 평가 지표와 구현 매핑을 정리합니다.",
  },
  {
    href: "/realtime",
    title: "Realtime",
    description: "TinyML 0.5ms 추론 목표와 200Hz 메인 루프 실시간성을 분리해 보여줍니다.",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
          Project Overview
        </p>
        <h2 className="mt-3 max-w-3xl text-3xl font-semibold text-[#111827]">
          논문 실험 결과를 웹 대시보드로 재구성한 Edge AI 포트폴리오
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#475569]">
          STM32F446RE에서 수집한 Kalman Filter 실험 CSV를 업로드해 Fixed KF,
          CM-AKF, TinyML-AKF의 정확도와 실시간성 지표를 확인합니다. E1/E3는
          업로드 CSV 기반 동적 분석을 제공하고, E0/E2/E4/E5는 논문 확정값을
          카드와 표로 정리합니다.
        </p>
        <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold">
          <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-[#1d4ed8]">
            25/28컬럼 CSV
          </span>
          <span className="rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1 text-[#15803d]">
            논문 지표 구현
          </span>
          <span className="rounded-full border border-[#ede9fe] bg-[#faf5ff] px-3 py-1 text-[#6d28d9]">
            TinyML 35.32µs
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {pages.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm transition hover:border-[#2563eb] hover:shadow-md"
          >
            <h3 className="text-lg font-semibold text-[#111827]">{page.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#64748b]">
              {page.description}
            </p>
          </Link>
        ))}
      </section>
    </div>
  );
}
