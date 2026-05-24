"use client";

import {
  useE1Store,
  type E1AlgorithmId,
  E1_ALGORITHM_LABELS,
  E1_ALGORITHM_STYLES,
} from "@/lib/e1-store";

const ALL_ALGOS: E1AlgorithmId[] = ["raw", "fixed", "cm", "tinyml"];

export default function AlgorithmToggle() {
  const { selectedAlgorithms, hasTinyML, toggleAlgorithm } = useE1Store();

  return (
    <div className="flex flex-wrap gap-2">
      {ALL_ALGOS.map((id) => {
        const isDisabled = id === "tinyml" && !hasTinyML;
        const isSelected = selectedAlgorithms.includes(id);
        const algoStyle = E1_ALGORITHM_STYLES[id];

        return (
          <button
            key={id}
            type="button"
            disabled={isDisabled}
            title={isDisabled ? "TinyML CSV 수집 후 활성화됩니다" : undefined}
            onClick={() => !isDisabled && toggleAlgorithm(id)}
            className={`rounded-lg border px-5 py-2 text-base font-bold transition ${
              isDisabled
                ? "cursor-not-allowed border-[#e2e8f0] bg-[#f8fafc] text-[#cbd5e1]"
                : isSelected
                  ? "shadow-sm ring-2 ring-offset-2"
                  : "border-[#d1d5db] bg-white text-[#374151] hover:border-[#111827] hover:bg-[#f3f4f6]"
            }`}
            style={
              isSelected && !isDisabled
                ? {
                    backgroundColor: algoStyle.bg,
                    color: algoStyle.text,
                    borderColor: algoStyle.border,
                    boxShadow: `0 0 0 2px #ffffff, 0 0 0 4px ${algoStyle.border}`,
                  }
                : undefined
            }
          >
            {E1_ALGORITHM_LABELS[id]}
            {isDisabled && (
              <span className="ml-1.5 text-xs font-normal">준비 중</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
