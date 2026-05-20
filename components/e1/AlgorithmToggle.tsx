"use client";

import {
  useE1Store,
  type E1AlgorithmId,
  E1_ALGORITHM_LABELS,
  E1_ALGORITHM_COLORS,
} from "@/lib/e1-store";

const ALL_ALGOS: E1AlgorithmId[] = ["raw", "fixed", "cm", "tinyml"];

export default function AlgorithmToggle() {
  const { selectedAlgorithms, hasTinyML, toggleAlgorithm } = useE1Store();

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_ALGOS.map((id) => {
        const isDisabled = id === "tinyml" && !hasTinyML;
        const isSelected = selectedAlgorithms.includes(id);
        const color = E1_ALGORITHM_COLORS[id];

        return (
          <button
            key={id}
            type="button"
            disabled={isDisabled}
            title={isDisabled ? "TinyML CSV 수집 후 활성화됩니다" : undefined}
            onClick={() => !isDisabled && toggleAlgorithm(id)}
            className={`rounded-lg border px-4 py-1.5 text-sm font-semibold transition ${
              isDisabled
                ? "cursor-not-allowed border-[#e2e8f0] bg-[#f8fafc] text-[#cbd5e1]"
                : isSelected
                  ? "border-transparent text-white"
                  : "border-[#d9e0ea] bg-white text-[#475569] hover:border-[#94a3b8]"
            }`}
            style={
              isSelected && !isDisabled
                ? { backgroundColor: color, borderColor: color }
                : undefined
            }
          >
            {E1_ALGORITHM_LABELS[id]}
            {isDisabled && (
              <span className="ml-1.5 text-[10px] font-normal">준비 중</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
