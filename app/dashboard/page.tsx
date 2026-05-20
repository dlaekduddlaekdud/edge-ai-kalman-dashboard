"use client";

import Link from "next/link";
import { useKFStore } from "@/lib/store";
import { useE1Store } from "@/lib/e1-store";
import {
  ALGORITHM_LABELS,
  type AlgorithmId,
  type AlgorithmData,
  type ScenarioLabel,
} from "@/lib/dataset";
import EstimateLineChart from "@/components/charts/EstimateLineChart";
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
  const { algorithms, activeScenario } = useKFStore();
  const { runs: e1Runs } = useE1Store();

  const uploadedEntries = (Object.entries(algorithms) as [AlgorithmId, AlgorithmData][]).filter(
    ([, v]) => v !== undefined
  );
  const hasE1Data = Object.values(e1Runs).some((r) => r !== undefined);

  // E1은 e1-store 기준, 나머지는 KFStore 기준으로 비어 있으면 업로드 안내
  const isEmpty = activeScenario === "E1" ? !hasE1Data : uploadedEntries.length === 0;

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
          {uploadedEntries.map(([algoId, data]) => (
            <span
              key={algoId}
              className="rounded-md border border-[#d9e0ea] bg-[#f8fafc] px-2 py-1 text-xs text-[#475569]"
            >
              {ALGORITHM_LABELS[algoId]} · {data.rows.length}행
            </span>
          ))}
          <Link href="/upload" className="text-xs text-[#2563eb] hover:underline">
            CSV 변경
          </Link>
        </div>
      </section>

      <section>
        {activeScenario === "E1" ? (
          <E1View />
        ) : activeScenario === "E3" ? (
          <E3View algorithms={algorithms} />
        ) : (
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
            <EstimateLineChart
              algorithms={algorithms}
              title={`${activeScenario} — KF Estimate vs Ground Truth`}
            />
          </div>
        )}
      </section>
    </div>
  );
}
