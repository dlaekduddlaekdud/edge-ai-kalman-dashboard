"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useE1Store, type E1AlgorithmId } from "@/lib/e1-store";
import { ALL_RUNS, type RunId } from "@/lib/e1-csv-parser";
import { applyTrim, getGroundTruth } from "@/lib/e1-metrics";
import {
  BLOCKED_THRESHOLD_MM,
  R_CLAMP_MAX,
  buildTimeTicks,
  detectBlockedIntervals,
  getEstimate,
  paddedPositionDomain,
  type BlockedInterval,
  type ChartPoint,
  type DetectionMethod,
  type RChartPoint,
} from "@/lib/e3-blocking";
import E3AnalysisControls from "@/components/e1/E3AnalysisControls";
import E3MetricsTable from "@/components/e1/E3MetricsTable";
import E3PositionChart from "@/components/e1/charts/E3PositionChart";
import E3RRecoveryChart from "@/components/e1/charts/E3RRecoveryChart";

const BASE_ALGORITHMS: E1AlgorithmId[] = ["raw", "fixed", "cm"];

interface PositionData {
  blockedIntervals: BlockedInterval[];
  detectionMethod: DetectionMethod;
  chartData: ChartPoint[];
  xTicks: number[] | undefined;
  activeAlgos: E1AlgorithmId[];
  showGT: boolean;
  yDomain: [number, number];
}

const EMPTY_POSITION_DATA: PositionData = {
  blockedIntervals: [],
  detectionMethod: "threshold",
  chartData: [],
  xTicks: undefined,
  activeAlgos: [],
  showGT: false,
  yDomain: [0, 600],
};

export default function E3View() {
  const { runs, activeRun, selectedAlgorithms, hasTinyML, autoExcludeStop, trimTail } =
    useE1Store();

  const isAllRuns = activeRun === "all";
  const displayedRunId: RunId | undefined = isAllRuns
    ? ALL_RUNS.find((r) => runs[r] !== undefined)
    : (activeRun as RunId);

  const trimmedRows = useMemo(() => {
    const runData = displayedRunId ? runs[displayedRunId] : undefined;
    if (!runData || runData.rows.length === 0) return [];
    return applyTrim(runData.rows, autoExcludeStop, trimTail);
  }, [runs, displayedRunId, autoExcludeStop, trimTail]);

  // R̂ 회복 시계열 (cm_R vs tinyml_R)
  const { rChartData, rXTicks, rYMax } = useMemo(() => {
    if (trimmedRows.length === 0) {
      return { rChartData: [] as RChartPoint[], rXTicks: undefined, rYMax: 500 };
    }

    const hasTinymlR = hasTinyML && trimmedRows.every((r) => r.tinyml_R !== undefined);
    const points: RChartPoint[] = trimmedRows.map((r) => ({
      timestamp_ms: r.timestamp_ms,
      cm_R: Math.min(r.cm_R, R_CLAMP_MAX),
      tinyml_R:
        hasTinymlR && r.tinyml_R !== undefined ? Math.min(r.tinyml_R, R_CLAMP_MAX) : undefined,
    }));

    const allR = points.flatMap((p) =>
      [p.cm_R, p.tinyml_R].filter((v): v is number => v !== undefined),
    );
    // spread 대신 reduce — 대규모 R 배열(E4 등)에서 스택 오버플로우 방지
    const maxR = allR.length > 0 ? allR.reduce((m, v) => Math.max(m, v), -Infinity) : 500;

    return {
      rChartData: points,
      rXTicks: buildTimeTicks(points.map((p) => p.timestamp_ms)),
      rYMax: Math.ceil(maxR * 1.1),
    };
  }, [trimmedRows, hasTinyML]);

  // 위치 추정 시계열 + 차단 구간
  const position = useMemo<PositionData>(() => {
    if (trimmedRows.length === 0) return EMPTY_POSITION_DATA;

    const gt = getGroundTruth(trimmedRows);
    // 데모 CSV는 gt=0 → GT 라인 숨김
    const showGT = gt.some((v) => v !== 0);
    const { intervals, method } = detectBlockedIntervals(trimmedRows, gt);

    const algos = [...BASE_ALGORITHMS];
    const hasTinymlEstimate =
      hasTinyML && trimmedRows.every((r) => r.tinyml_estimate_mm !== undefined);
    if (hasTinymlEstimate) algos.push("tinyml");
    const activeAlgos = algos.filter((id) => selectedAlgorithms.includes(id));

    const chartData: ChartPoint[] = trimmedRows.map((r, i) => {
      const point: ChartPoint = { timestamp_ms: r.timestamp_ms, gt: gt[i] };
      for (const algoId of activeAlgos) {
        const value = getEstimate(r, algoId);
        if (value !== undefined) point[algoId] = value;
      }
      return point;
    });

    const yValues = chartData.flatMap((point) =>
      [showGT ? point.gt : undefined, point.raw, point.fixed, point.cm, point.tinyml].filter(
        (value): value is number => typeof value === "number" && Number.isFinite(value),
      ),
    );

    return {
      blockedIntervals: intervals,
      detectionMethod: method,
      chartData,
      xTicks: buildTimeTicks(chartData.map((p) => p.timestamp_ms)),
      activeAlgos,
      showGT,
      yDomain: paddedPositionDomain(yValues),
    };
  }, [trimmedRows, selectedAlgorithms, hasTinyML]);

  const hasAnyRun = Object.values(runs).some((r) => r !== undefined);
  if (!hasAnyRun) return <UploadPrompt />;

  return (
    <div className="space-y-4">
      <E3AnalysisControls />

      <E3MetricsTable selectedAlgorithms={selectedAlgorithms} />

      <BlockedIntervalNotice
        count={position.blockedIntervals.length}
        method={position.detectionMethod}
      />

      {position.chartData.length > 0 && (
        <E3PositionChart
          data={position.chartData}
          xTicks={position.xTicks}
          yDomain={position.yDomain}
          activeAlgos={position.activeAlgos}
          blockedIntervals={position.blockedIntervals}
          showGT={position.showGT}
          isAllRuns={isAllRuns}
          displayedRunId={displayedRunId}
        />
      )}

      <E3RRecoveryChart
        data={rChartData}
        xTicks={rXTicks}
        yMax={rYMax}
        blockedIntervals={position.blockedIntervals}
        isAllRuns={isAllRuns}
        displayedRunId={displayedRunId}
      />
    </div>
  );
}

function BlockedIntervalNotice({
  count,
  method,
}: {
  count: number;
  method: DetectionMethod;
}) {
  if (count === 0) {
    return (
      <p className="text-xs text-[#94a3b8]">
        차단 구간을 탐지하지 못했습니다.
        {method === "threshold" && ` (ToF ${BLOCKED_THRESHOLD_MM}mm 이상 급감 구간 기준)`}
      </p>
    );
  }

  return (
    <p className="text-xs text-[#64748b]">
      차단 구간 {count}개 탐지
      <span className="ml-2 inline-block h-2 w-4 rounded-sm bg-[#fee2e2]" />
      <span className="ml-1">
        {method === "range_status"
          ? "range_status 비정상 구간"
          : `ToF ${BLOCKED_THRESHOLD_MM}mm 이상 급감 구간`}
      </span>
    </p>
  );
}

function UploadPrompt() {
  return (
    <div className="rounded-lg border border-[#d1d5db] bg-[#f3f4f6] p-6 shadow-sm">
      <p className="text-base font-semibold text-[#4b5563]">업로드된 CSV가 없습니다.</p>
      <p className="mt-2 text-sm text-[#374151]">
        Data 탭에서 E3 시나리오를 선택하고 데이터를 불러오세요. 파일명 형식:{" "}
        <code className="rounded bg-[#f3f4f6] px-1">E3_run01.csv</code> ~{" "}
        <code className="rounded bg-[#f3f4f6] px-1">E3_run05.csv</code>
      </p>
      <Link
        href="/upload"
        className="mt-4 inline-block rounded-md bg-[#111827] px-4 py-2 text-sm font-semibold text-white hover:bg-[#111827]"
      >
        Data 탭으로 이동
      </Link>
    </div>
  );
}
