import Link from "next/link";

const plannedPages = [
  {
    href: "/upload",
    title: "CSV Upload",
    description: "18컬럼 실험 CSV 파싱 및 검증을 위한 진입 페이지입니다.",
  },
  {
    href: "/dashboard",
    title: "Scenario Dashboard",
    description: "시나리오 선택, 알고리즘 토글, 차트 분기를 계획 중입니다.",
  },
  {
    href: "/ablation",
    title: "Ablation",
    description: "6-feature, 5-feature, 3-feature 비교 뷰를 계획 중입니다.",
  },
  {
    href: "/method",
    title: "Method",
    description: "논문 4.3절 평가 지표와 구현 매핑을 정리할 예정입니다.",
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
          졸업연구 평가 지표와 실험 시나리오를 웹 대시보드로 옮기는 MVP
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#475569]">
          이 저장소는 기존 실험 CSV를 분석하고 시각화하기 위한 포트폴리오용
          대시보드의 초기 개발 단계입니다. 현재 화면은 실제 분석 기능이 아닌
          프로젝트 구조와 페이지 목적을 보여주는 placeholder입니다.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        {plannedPages.map((page) => (
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
