import Papa from "papaparse";

/**
 * 3-feature 모델의 성능 열화 판정 임계.
 *
 * RMSE_MM: 논문 표 5-3에서 E2 acryl run03이 97.00 mm로 단독 이탈했고,
 *   나머지 시나리오는 최대 30 mm대에 머문다. 두 군을 가르는 값으로 50을 둔다.
 * RATIO_VS_CM: 절대값이 낮은 시나리오에서도 상대 열화를 잡기 위한 보조 기준.
 *   CM-AKF 대비 2배를 넘으면 같은 데이터에서 모델이 갈린 것으로 본다.
 */
export const DIVERGENCE_RMSE_MM = 50;
export const DIVERGENCE_RATIO_VS_CM = 2;

export function isDiverged(tinyml3f: number, cm: number): boolean {
  return tinyml3f > DIVERGENCE_RMSE_MM || tinyml3f > cm * DIVERGENCE_RATIO_VS_CM;
}

export interface AblationHoldoutRow {
  scenario: string;
  n: number;
  fixed: number;
  cm: number;
  tinyml3f: number;
  cmVs3fDiff: number;
  diverged: boolean;
}

export interface AblationWeightedAvg {
  n: number;
  fixed: number;
  cm: number;
  tinyml3f: number;
  cmVs3fDiff: number;
}

export interface AblationParseResult {
  rows: AblationHoldoutRow[];
  weightedAvg: AblationWeightedAvg | null;
  /** 수치 파싱에 실패해 제외된 행 번호(헤더 제외 1-based). 화면에 노출한다. */
  droppedRows: number[];
}

function formatScenarioName(raw: string): string {
  return raw.replace(/_/g, " ");
}

export function parseAblationHoldout(csvText: string): AblationParseResult {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows: AblationHoldoutRow[] = [];
  const droppedRows: number[] = [];

  result.data.forEach((r, i) => {
    const fixed = parseFloat(r.rmse_fixed);
    const cm = parseFloat(r.rmse_cm);
    const tinyml3f = parseFloat(r.rmse_3feat);
    const n = parseInt(r.n, 10);

    // 이 CSV는 표시 전용이라 한 행이 깨져도 나머지를 보여주는 편이 낫다.
    // 다만 몇 행이 빠졌는지는 반드시 호출부로 전달한다.
    if ([fixed, cm, tinyml3f, n].some(Number.isNaN)) {
      droppedRows.push(i + 1);
      return;
    }

    rows.push({
      scenario: formatScenarioName(r.scenario),
      n,
      fixed,
      cm,
      tinyml3f,
      cmVs3fDiff: tinyml3f - cm,
      diverged: isDiverged(tinyml3f, cm),
    });
  });

  const totalN = rows.reduce((s, r) => s + r.n, 0);
  if (totalN === 0) {
    return { rows, weightedAvg: null, droppedRows };
  }

  const wavg = (get: (r: AblationHoldoutRow) => number) =>
    rows.reduce((s, r) => s + get(r) * r.n, 0) / totalN;

  return {
    rows,
    droppedRows,
    weightedAvg: {
      n: totalN,
      fixed: wavg((r) => r.fixed),
      cm: wavg((r) => r.cm),
      tinyml3f: wavg((r) => r.tinyml3f),
      cmVs3fDiff: wavg((r) => r.cmVs3fDiff),
    },
  };
}