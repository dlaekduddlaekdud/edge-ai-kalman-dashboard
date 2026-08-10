import { type KFRow } from "@/lib/csv-parser";

export type AlgorithmId = "raw" | "fixed" | "cm" | "tinyml";

export type ScenarioLabel = "E0" | "E1" | "E2" | "E3" | "E4" | "E5";

export interface AlgorithmData {
  rows: KFRow[];
  fileName: string;
}

export const ALGORITHM_LABELS: Record<AlgorithmId, string> = {
  raw: "Raw ToF",
  fixed: "Fixed KF",
  cm: "CM-AKF",
  tinyml: "TinyML-AKF",
};

/** 파일명에서 시나리오 라벨 파싱. E1_run01.csv → "E1"
 *  \b는 _ 앞에서 word boundary로 인식 안 되므로 명시적 구분자 패턴 사용 */
export function parseScenarioFromFileName(fileName: string): ScenarioLabel | null {
  const match = fileName.toUpperCase().match(/(?:^|[^A-Z0-9])(E[0-5])(?=[^0-9]|$)/);
  if (!match) return null;
  return match[1] as ScenarioLabel;
}