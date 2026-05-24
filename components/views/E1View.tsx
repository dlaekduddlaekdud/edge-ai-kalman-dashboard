"use client";

import { useE1Store } from "@/lib/e1-store";
import RunSelector from "@/components/e1/RunSelector";
import AlgorithmToggle from "@/components/e1/AlgorithmToggle";
import TrimControl from "@/components/e1/TrimControl";
import E1MetricCards from "@/components/e1/E1MetricCards";
import PositionChart from "@/components/e1/charts/PositionChart";
import ResidualChart from "@/components/e1/charts/ResidualChart";
import CMRChart from "@/components/e1/charts/CMRChart";
import KalmanGainChart from "@/components/e1/charts/KalmanGainChart";

export default function E1View() {
  const { runs } = useE1Store();
  const hasAnyRun = Object.values(runs).some((r) => r !== undefined);

  return (
    <div className="space-y-6">
      {/* 메트릭 카드 — CSV 없이도 논문 확정값 즉시 표시 */}
      <E1MetricCards />

      {hasAnyRun ? (
        <>
          {/* 컨트롤 패널 */}
          <div className="rounded-lg border border-[#d1d5db] bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xl font-black text-[#111827]">
                  업로드 CSV 분석
                </p>
                <span className="rounded-full border border-[#111827] bg-[#111827] px-3 py-1 text-sm font-bold text-white">
                  동적 분석
                </span>
              </div>
              <div>
                <p className="mb-2 text-lg font-black text-[#111827]">런 선택</p>
                <RunSelector />
              </div>
              <div>
                <p className="mb-2 text-lg font-black text-[#111827]">알고리즘</p>
                <AlgorithmToggle />
              </div>
              <div>
                <p className="mb-2 text-lg font-black text-[#111827]">트림 설정</p>
                <TrimControl />
              </div>
            </div>
          </div>

          {/* 차트 1: 위치 추정 */}
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
            <PositionChart />
          </div>

          {/* 차트 2, 3: 잔차 + CM-R */}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
              <ResidualChart />
            </div>
            <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
              <CMRChart />
            </div>
          </div>

          {/* 차트 4: Kalman Gain */}
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
            <KalmanGainChart />
          </div>
        </>
      ) : (
        /* CSV 없을 때 — 부드러운 안내 (페이지 차단 없이) */
        <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-5 py-4">
          <p className="text-base font-semibold text-[#4b5563]">
            위치 추정 차트·잔차 분석은 CSV 로드 후 활성화됩니다.
          </p>
        </div>
      )}
    </div>
  );
}
