import { create } from "zustand";
import type { E1Row, RunId } from "@/lib/e1-csv-parser";

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
  setRun: (id: RunId, rows: E1Row[], fileName: string) => void;
  removeRun: (id: RunId) => void;
  setActiveRun: (r: RunId | "all") => void;
  toggleAlgorithm: (id: E1AlgorithmId) => void;
  setAutoExcludeStop: (v: boolean) => void;
  setTrimTail: (n: number) => void;
}

function detectTinyML(runs: Partial<Record<RunId, E1RunData>>): boolean {
  return Object.values(runs).some(
    (r) => r && r.rows.length > 0 && r.rows[0].kf_estimate_tinyml !== undefined,
  );
}

export const useE1Store = create<E1Store>((set) => ({
  runs: {},
  activeRun: "run1",
  selectedAlgorithms: ["raw", "fixed", "cm"],
  autoExcludeStop: true,
  trimTail: 0,
  hasTinyML: false,

  setRun: (id, rows, fileName) =>
    set((state) => {
      const next = { ...state.runs, [id]: { rows, fileName } };
      return { runs: next, hasTinyML: detectTinyML(next) };
    }),

  removeRun: (id) =>
    set((state) => {
      const next = { ...state.runs };
      delete next[id];
      return { runs: next, hasTinyML: detectTinyML(next) };
    }),

  setActiveRun: (r) => set({ activeRun: r }),

  toggleAlgorithm: (id) =>
    set((state) => ({
      selectedAlgorithms: state.selectedAlgorithms.includes(id)
        ? state.selectedAlgorithms.filter((a) => a !== id)
        : [...state.selectedAlgorithms, id],
    })),

  setAutoExcludeStop: (v) => set({ autoExcludeStop: v }),

  setTrimTail: (n) => set({ trimTail: Math.max(0, Math.floor(n)) }),
}));
