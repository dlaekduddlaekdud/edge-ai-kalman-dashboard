import { create } from "zustand";
import { type KFRow, type ScenarioId } from "@/lib/csv-parser";

interface KFStore {
  rows: KFRow[];
  fileName: string | null;
  scenarioIds: ScenarioId[];
  setData: (rows: KFRow[], fileName: string) => void;
  clearData: () => void;
}

function extractScenarioIds(rows: KFRow[]): ScenarioId[] {
  const unique = Array.from(new Set(rows.map((row) => row.scenario_id)));
  return unique.sort((a, b) => {
    const toNum = (id: ScenarioId) =>
      typeof id === "number" ? id : Number(id.slice(1));
    return toNum(a) - toNum(b);
  });
}

export const useKFStore = create<KFStore>((set) => ({
  rows: [],
  fileName: null,
  scenarioIds: [],
  setData: (rows, fileName) =>
    set({ rows, fileName, scenarioIds: extractScenarioIds(rows) }),
  clearData: () => set({ rows: [], fileName: null, scenarioIds: [] }),
}));
