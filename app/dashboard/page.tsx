"use client";

import Link from "next/link";
import { useE1Store } from "@/lib/e1-store";
import { type ScenarioLabel } from "@/lib/dataset";
import E1View from "@/components/views/E1View";
import E3View from "@/components/views/E3View";

const SCENARIO_DESCRIPTIONS: Record<ScenarioLabel, string> = {
  E0: "합성 데이터 — Fixed KF 단독",
  E1: "정상 baseline — 알고리즘 비교",
  E2: "벽 재질별 — 알고리즘 비교",
  E3: "ToF 차단 구간 — 알고리즘 비교",
  E4: "R_hat drift — 알고리즘 비교",
  E5: "신호 감쇠 — 알고리즘 비교",
};

export default function DashboardPage() {
  const { runs, activeScenario } = useE1Store();
  const hasData = Object.values(runs).some((r) => r !== undefined);

  // E0는 CSV 없이도 표시, 나머지는 데이터가 있어야 함
  const isEmpty = activeScenario !== "E0" && !hasData;

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
            Dashboard
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[#111827]">
            시나리오별 분석 대시보드
          </h2>
        </section>
        <section className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-6 shadow-sm">
          <p className="text-base font-semibold text-[#92400e]">업로드된 CSV가 없습니다.</p>
          <p className="mt-2 text-sm text-[#78350f]">
            먼저 실험 CSV를 업로드해야 대시보드를 확인할 수 있습니다.
          </p>
          <Link
            href="/upload"
            className="mt-4 inline-block rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
          >
            CSV 업로드하러 가기
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
          Dashboard
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[#111827]">
          시나리오별 분석 대시보드
        </h2>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-sm font-semibold text-[#1d4ed8]">
            {activeScenario}
          </span>
          <span className="text-sm text-[#64748b]">
            {SCENARIO_DESCRIPTIONS[activeScenario]}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Link href="/upload" className="text-xs text-[#2563eb] hover:underline">
            CSV 변경
          </Link>
        </div>
      </section>

      <section>
        {activeScenario === "E1" ? (
          <E1View />
        ) : activeScenario === "E3" ? (
          <E3View />
        ) : activeScenario === "E0" ? (
          <div className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] p-6 shadow-sm">
            <p className="text-base font-semibold text-[#1d4ed8]">E0 — Python 합성 시뮬레이션</p>
            <p className="mt-2 text-sm text-[#1e40af]">
              E0는 CSV 업로드 없이 논문 확정 수치 카드로 표시됩니다.
              (P2에서 E0View 구현 예정)
            </p>
          </div>
        ) : (
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
            <p className="text-sm font-semibold text-[#94a3b8]">
              {activeScenario} — 데이터 없음 / 업로드 후 확인
            </p>
            <p className="mt-2 text-sm text-[#64748b]">
              {activeScenario} 전용 뷰는 P2에서 구현 예정입니다.
              런별 CSV를 업로드한 후 이 화면을 새로 고침하세요.
            </p>
            <Link
              href="/upload"
              className="mt-4 inline-block rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
            >
              CSV 업로드하러 가기
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
