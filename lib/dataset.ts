import { type KFRow } from "@/lib/csv-parser";

export type AlgorithmId = "raw" | "fixed" | "cm" | "tinyml";

export type ScenarioLabel = "E0" | "E1" | "E2" | "E3" | "E4" | "E5";

export interface AlgorithmData {
  rows: KFRow[];
  fileName: string;
}

/** 시나리오별 알고리즘 슬롯. Zustand 직렬화를 위해 plain object 사용 */
export type AlgorithmSlot = Partial<Record<AlgorithmId, AlgorithmData>>;

export interface KFDataset {
  scenario: ScenarioLabel;
  runId: number;
  /** array index로 매칭. 행 수가 동일한 CSV끼리만 유효 */
  algorithms: AlgorithmSlot;
}

/** E0는 합성 데이터라 TinyML 학습 불가. raw/cm/tinyml 슬롯 없음 */
export const SCENARIO_ALGORITHM_SLOTS: Record<ScenarioLabel, AlgorithmId[]> = {
  E0: ["fixed"],
  E1: ["raw", "fixed", "cm", "tinyml"],
  E2: ["raw", "fixed", "cm", "tinyml"],
  E3: ["raw", "fixed", "cm", "tinyml"],
  E4: ["raw", "fixed", "cm", "tinyml"],
  E5: ["raw", "fixed", "cm", "tinyml"],
};

export const ALGORITHM_LABELS: Record<AlgorithmId, string> = {
  raw: "Raw ToF",
  fixed: "Fixed KF",
  cm: "CM-AKF",
  tinyml: "TinyML-AKF",
};

export const ALL_SCENARIOS: ScenarioLabel[] = ["E0", "E1", "E2", "E3", "E4", "E5"];

/** 파일명에서 알고리즘 ID 파싱. E1_run1_fixed.csv → "fixed" */
export function parseAlgorithmFromFileName(fileName: string): AlgorithmId | null {
  const lower = fileName.toLowerCase();
  if (lower.includes("tinyml")) return "tinyml";
  if (lower.includes("_cm")) return "cm";
  if (lower.includes("fixed")) return "fixed";
  if (lower.includes("raw")) return "raw";
  return null;
}

/** 파일명에서 시나리오 라벨 파싱. E1_run1_fixed.csv → "E1"
 *  \b는 _ 앞에서 word boundary로 인식 안 되므로 명시적 구분자 패턴 사용 */
export function parseScenarioFromFileName(fileName: string): ScenarioLabel | null {
  const match = fileName.toUpperCase().match(/(?:^|[^A-Z0-9])(E[0-5])(?=[^0-9]|$)/);
  if (!match) return null;
  return match[1] as ScenarioLabel;
}
