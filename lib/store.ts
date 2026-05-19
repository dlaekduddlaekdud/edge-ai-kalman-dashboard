import { create } from "zustand";
import { type KFRow } from "@/lib/csv-parser";
import {
  type AlgorithmId,
  type AlgorithmData,
  type ScenarioLabel,
  parseAlgorithmFromFileName,
  parseScenarioFromFileName,
} from "@/lib/dataset";

interface AlgorithmStore {
  /** 현재 선택된 시나리오 (업로드 슬롯 UI 기준) */
  activeScenario: ScenarioLabel;
  /** 알고리즘별 데이터. Zustand 직렬화를 위해 plain object 사용 */
  algorithms: Partial<Record<AlgorithmId, AlgorithmData>>;
  setActiveScenario: (scenario: ScenarioLabel) => void;
  setAlgorithmData: (id: AlgorithmId, rows: KFRow[], fileName: string) => void;
  removeAlgorithmData: (id: AlgorithmId) => void;
  clearAllAlgorithms: () => void;
}

export const useKFStore = create<AlgorithmStore>((set) => ({
  activeScenario: "E1",
  algorithms: {},
  setActiveScenario: (scenario) => set({ activeScenario: scenario, algorithms: {} }),
  setAlgorithmData: (id, rows, fileName) =>
    set((state) => ({
      algorithms: { ...state.algorithms, [id]: { rows, fileName } },
    })),
  removeAlgorithmData: (id) =>
    set((state) => {
      const next = { ...state.algorithms };
      delete next[id];
      return { algorithms: next };
    }),
  clearAllAlgorithms: () => set({ algorithms: {} }),
}));

/** 파일명에서 알고리즘 ID와 시나리오 라벨을 파싱하여 store에 저장 */
export function resolveAlgorithmUpload(
  fileName: string
): { algorithmId: AlgorithmId; scenario: ScenarioLabel } | null {
  const algorithmId = parseAlgorithmFromFileName(fileName);
  const scenario = parseScenarioFromFileName(fileName);
  if (!algorithmId || !scenario) return null;
  return { algorithmId, scenario };
}
