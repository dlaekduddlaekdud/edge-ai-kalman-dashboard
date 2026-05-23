import { create } from "zustand";
import { ALL_RUNS, type E1Row, type RunId } from "@/lib/e1-csv-parser";
import type { ScenarioLabel } from "@/lib/dataset";

export type E1AlgorithmId = "raw" | "fixed" | "cm" | "tinyml";

export const E1_ALGORITHM_LABELS: Record<E1AlgorithmId, string> = {
  raw: "Raw ToF",
  fixed: "Fixed KF",
  cm: "CM-AKF",
  tinyml: "TinyML-AKF",
};

export const E1_ALGORITHM_COLORS: Record<E1AlgorithmId, string> = {
  raw: "#f97316",
  fixed: "#2563eb",
  cm: "#16a34a",
  tinyml: "#7c3aed",
};

interface E1RunData {
  rows: E1Row[];
  fileName: string;
}

interface E1Store {
  runs: Partial<Record<RunId, E1RunData>>;
  activeRun: RunId | "all";
  selectedAlgorithms: E1AlgorithmId[];
  autoExcludeStop: boolean;
  trimTail: number;
  hasTinyML: boolean;
  /** 현재 활성 시나리오 (E1~E5 통합 스토어) */
  activeScenario: ScenarioLabel;
  setRun: (id: RunId, rows: E1Row[], fileName: string) => void;
  removeRun: (id: RunId) => void;
  setActiveRun: (r: RunId | "all") => void;
  toggleAlgorithm: (id: E1AlgorithmId) => void;
  setAutoExcludeStop: (v: boolean) => void;
  setTrimTail: (n: number) => void;
  setActiveScenario: (s: ScenarioLabel) => void;
}

function runHasTinyML(run?: E1RunData): boolean {
  return !!run && run.rows.length > 0 && run.rows.every((r) => r.tinyml_estimate_mm !== undefined);
}

function selectedRunHasTinyML(
  runs: Partial<Record<RunId, E1RunData>>,
  activeRun: RunId | "all",
): boolean {
  if (activeRun !== "all") return runHasTinyML(runs[activeRun]);

  const uploadedRuns = ALL_RUNS.map((id) => runs[id]).filter((run): run is E1RunData => !!run);
  return uploadedRuns.length > 0 && uploadedRuns.every(runHasTinyML);
}

function nextActiveRunAfterRemove(
  runs: Partial<Record<RunId, E1RunData>>,
  removedId: RunId,
  activeRun: RunId | "all",
): RunId | "all" {
  if (activeRun === "all") {
    const uploadedCount = ALL_RUNS.filter((id) => runs[id]).length;
    return uploadedCount > 1 ? "all" : (ALL_RUNS.find((id) => runs[id]) ?? "run1");
  }

  if (activeRun !== removedId) return activeRun;
  return ALL_RUNS.find((id) => runs[id]) ?? "run1";
}

export const useE1Store = create<E1Store>((set) => ({
  runs: {},
  activeRun: "run1",
  selectedAlgorithms: ["raw", "fixed", "cm"],
  autoExcludeStop: true,
  trimTail: 0,
  hasTinyML: false,
  activeScenario: "E1",

  setRun: (id, rows, fileName) =>
    set((state) => {
      const next = { ...state.runs, [id]: { rows, fileName } };
      return {
        runs: next,
        activeRun: id,
        hasTinyML: selectedRunHasTinyML(next, id),
      };
    }),

  removeRun: (id) =>
    set((state) => {
      const next = { ...state.runs };
      delete next[id];
      const activeRun = nextActiveRunAfterRemove(next, id, state.activeRun);
      return {
        runs: next,
        activeRun,
        hasTinyML: selectedRunHasTinyML(next, activeRun),
      };
    }),

  setActiveRun: (r) =>
    set((state) => ({
      activeRun: r,
      hasTinyML: selectedRunHasTinyML(state.runs, r),
    })),

  toggleAlgorithm: (id) =>
    set((state) => ({
      selectedAlgorithms: state.selectedAlgorithms.includes(id)
        ? state.selectedAlgorithms.filter((a) => a !== id)
        : [...state.selectedAlgorithms, id],
    })),

  setAutoExcludeStop: (v) => set({ autoExcludeStop: v }),

  setTrimTail: (n) => set({ trimTail: Math.max(0, Math.floor(n)) }),

  // 시나리오 변경 시 런 데이터 초기화
  setActiveScenario: (s) => set({ activeScenario: s, runs: {}, activeRun: "run1", hasTinyML: false }),
}));
