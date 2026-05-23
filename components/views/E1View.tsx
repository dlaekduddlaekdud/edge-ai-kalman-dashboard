"use client";

import Link from "next/link";
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
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
                  업로드 CSV 분석
                </p>
                <span className="rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1 text-xs font-semibold text-[#15803d]">
                  동적 분석
                </span>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">런 선택</p>
                <RunSelector />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">알고리즘</p>
                <AlgorithmToggle />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">트림 설정</p>
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
        <div className="flex items-center justify-between rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-5 py-4">
          <p className="text-sm text-[#64748b]">
            위치 추정 차트·잔차 분석은 CSV 로드 후 활성화됩니다.
          </p>
          <Link
            href="/upload"
            className="shrink-0 rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
          >
            E1 데이터 불러오기 →
          </Link>
        </div>
      )}
    </div>
  );
}
