"use client";

import { useE1Store } from "@/lib/e1-store";
import { ALL_RUNS, RUN_LABELS, type RunId } from "@/lib/e1-csv-parser";

export default function RunSelector() {
  const { runs, activeRun, setActiveRun } = useE1Store();

  const uploadedRuns = ALL_RUNS.filter((r) => runs[r] !== undefined);
  const showAll = uploadedRuns.length > 1;
  const tabs: (RunId | "all")[] = showAll ? ["all", ...uploadedRuns] : uploadedRuns;

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
            className={`rounded-lg border px-5 py-2 text-base font-bold transition ${
              isActive
                ? "border-[#111827] bg-[#111827] text-white"
                : "border-[#d1d5db] bg-white text-[#374151] hover:border-[#111827] hover:bg-[#f3f4f6]"
            }`}
          >
            {RUN_LABELS[r]}
            {rowCount !== undefined && (
              <span className={`ml-1.5 text-sm font-semibold ${isActive ? "text-[#e5e7eb]" : "text-[#6b7280]"}`}>
                {rowCount}행
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
