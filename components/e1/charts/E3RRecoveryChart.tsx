"use client";

import {
  Line,
  LineChart,
  Legend,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { E1_CHART_LINE_COLORS } from "@/lib/e1-store";
import { RUN_LABELS, type RunId } from "@/lib/e1-csv-parser";
import { PAPER_RESULTS } from "@/lib/paper-results";
import { algorithmStyles } from "@/lib/palette";
import { R_CLAMP_MAX, type BlockedInterval, type RChartPoint } from "@/lib/e3-blocking";

interface Props {
  data: RChartPoint[];
  xTicks: number[] | undefined;
  yMax: number;
  blockedIntervals: BlockedInterval[];
  isAllRuns: boolean;
  displayedRunId: RunId | undefined;
}

/**
 * 차단 이탈 후 R̂ 회복 속도 비교 (논문 그림 5-1 대응).
 * 28컬럼 TinyML CSV가 없으면 논문 확정 수치 카드로 대체한다.
 */
export default function E3RRecoveryChart({
  data,
  xTicks,
  yMax,
  blockedIntervals,
  isAllRuns,
  displayedRunId,
}: Props) {
  const hasTinyMLSeries = data.some((p) => p.tinyml_R !== undefined);

  if (data.length === 0 || !hasTinyMLSeries) {
    return <PaperFallbackCard />;
  }

  return (
    <div className="rounded-lg border border-[#d1d5db] bg-white p-5 shadow-sm">
      <p className="text-2xl font-black text-[#111827]">
        차트 — R̂ 회복 시계열 (CM-AKF vs TinyML-AKF)
        {isAllRuns && (
          <span className="ml-2 text-base font-semibold text-[#6b7280]">
            (All: {displayedRunId ? RUN_LABELS[displayedRunId] : "첫 run"} 표시)
          </span>
        )}
      </p>
      <p className="mt-1 text-lg text-[#6b7280]">
        차단 이탈 후 적응 노이즈 공분산 R̂ 회복 속도 비교. 클램프{" "}
        {R_CLAMP_MAX.toLocaleString()} mm².
      </p>
      <div className="mt-3">
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
            <XAxis
              dataKey="timestamp_ms"
              ticks={xTicks}
              tick={{ fontSize: 15 }}
              tickFormatter={(v: number) => String(v)}
              label={{ value: "timestamp (ms)", position: "insideBottom", offset: -2, fontSize: 15 }}
              height={46}
            />
            <YAxis
              domain={[0, yMax]}
              tick={{ fontSize: 15 }}
              label={{ value: "R̂ (mm²)", angle: -90, position: "insideLeft", offset: 10, fontSize: 15 }}
            />
            <Tooltip
              formatter={(v) => [typeof v === "number" ? `${v.toFixed(2)} mm²` : v]}
              labelFormatter={(l) => `t = ${l} ms`}
            />
            <Legend verticalAlign="top" height={34} wrapperStyle={{ fontSize: 16, fontWeight: 700 }} />
            {blockedIntervals.map((interval, i) => (
              <ReferenceArea
                key={i}
                x1={interval.x1}
                x2={interval.x2}
                fill="#fee2e2"
                fillOpacity={0.45}
                strokeOpacity={0}
              />
            ))}
            <Line
              type="monotone"
              dataKey="cm_R"
              name="CM-AKF R̂"
              stroke={E1_CHART_LINE_COLORS.cm}
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="tinyml_R"
              name="TinyML-AKF R̂"
              stroke={E1_CHART_LINE_COLORS.tinyml}
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/** 25컬럼 CSV 또는 데이터 없을 때: 논문 확정 수치 표시 */
function PaperFallbackCard() {
  return (
    <div className="rounded-lg border border-[#d1d5db] bg-white p-5 shadow-sm">
      <p className="text-lg font-black text-[#111827]">
        R̂ 회복 시간 — 논문 확정 수치 (그림 5-1 기준)
      </p>
      <p className="mt-1 text-base text-[#6b7280]">
        28컬럼 TinyML CSV 업로드 시 동적 차트로 전환됩니다.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div
          className="rounded-md border p-4"
          style={{
            borderColor: algorithmStyles.tinymlAkf.border,
            backgroundColor: algorithmStyles.tinymlAkf.bg,
          }}
        >
          <p className="text-base font-black" style={{ color: algorithmStyles.tinymlAkf.text }}>
            TinyML-AKF
          </p>
          <p className="mt-1 text-3xl font-black" style={{ color: algorithmStyles.tinymlAkf.text }}>
            {PAPER_RESULTS.E3.recoveryTimeTinyML_ms} ms
          </p>
          <p className="mt-0.5 text-xs text-[#4b5563]">3 frames @ 50Hz</p>
        </div>
        <div
          className="rounded-md border p-4"
          style={{
            borderColor: algorithmStyles.cmAkf.border,
            backgroundColor: algorithmStyles.cmAkf.bg,
          }}
        >
          <p className="text-xs font-semibold" style={{ color: algorithmStyles.cmAkf.text }}>
            CM-AKF
          </p>
          <p className="mt-1 text-2xl font-bold" style={{ color: algorithmStyles.cmAkf.text }}>
            {PAPER_RESULTS.E3.recoveryTimeCM_ms} ms
          </p>
          <p className="mt-0.5 text-xs text-[#4b5563]">8 frames @ 50Hz</p>
        </div>
      </div>
      <div className="mt-3 rounded-md bg-[#f3f4f6] px-4 py-2">
        <p className="text-sm font-semibold text-[#374151]">→ TinyML 약 2.7× 빠른 회복</p>
        <p className="mt-0.5 text-xs text-[#4b5563]">
          CM-AKF는 R̂ 재학습(160ms), TinyML은 추론 즉시 반응(60ms)
        </p>
      </div>
    </div>
  );
}
