"use client";

import { useE1Store } from "@/lib/e1-store";
import { ALL_RUNS, RUN_LABELS, type RunId } from "@/lib/e1-csv-parser";

export default function RunSelector() {
  const { runs, activeRun, setActiveRun } = useE1Store();

  const uploadedRuns = ALL_RUNS.filter((r) => runs[r] !== undefined);
  const showAll = uploadedRuns.length > 1;
  const tabs: (RunId | "all")[] = showAll ? [...uploadedRuns, "all"] : uploadedRuns;

  if (tabs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((r) => {
        const isActive = activeRun === r;
        const rowCount = r !== "all" ? runs[r as RunId]?.rows.length : undefined;
        return (
          <button
            key={r}
            type="button"
            onClick={() => setActiveRun(r)}
            className={`rounded-lg border px-4 py-1.5 text-sm font-semibold transition ${
              isActive
                ? "border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]"
                : "border-[#d9e0ea] bg-white text-[#475569] hover:border-[#94a3b8]"
            }`}
          >
            {RUN_LABELS[r]}
            {rowCount !== undefined && (
              <span className="ml-1.5 text-xs font-normal text-[#94a3b8]">
                {rowCount}행
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
