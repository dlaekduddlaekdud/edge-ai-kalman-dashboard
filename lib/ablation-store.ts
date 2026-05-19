import { create } from "zustand";
import { type KFRow } from "@/lib/csv-parser";

export type AblationSetId = "6f" | "5f" | "3f";

export interface AblationData {
  rows: KFRow[];
  fileName: string;
}

interface AblationStore {
  slots: Partial<Record<AblationSetId, AblationData>>;
  setSlot: (id: AblationSetId, rows: KFRow[], fileName: string) => void;
  removeSlot: (id: AblationSetId) => void;
  clearAll: () => void;
}

export const useAblationStore = create<AblationStore>((set) => ({
  slots: {},

  setSlot: (id, rows, fileName) =>
    set((state) => ({
      slots: { ...state.slots, [id]: { rows, fileName } },
    })),

  removeSlot: (id) =>
    set((state) => {
      const next = { ...state.slots };
      delete next[id];
      return { slots: next };
    }),

  clearAll: () => set({ slots: {} }),
}));
