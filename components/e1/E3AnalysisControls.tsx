"use client";

import RunSelector from "@/components/e1/RunSelector";
import AlgorithmToggle from "@/components/e1/AlgorithmToggle";
import TrimControl from "@/components/e1/TrimControl";

/** E3 분석 조건(런·알고리즘·트림) 선택 패널 */
export default function E3AnalysisControls() {
  return (
    <div className="rounded-lg border border-[#d1d5db] bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xl font-black text-[#111827]">업로드 CSV 계산값</p>
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
  );
}
