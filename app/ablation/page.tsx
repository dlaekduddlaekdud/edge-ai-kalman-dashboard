"use client";

import { useRef, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAblationStore, type AblationSetId } from "@/lib/ablation-store";
import { parseKFCSV, type KFRow } from "@/lib/csv-parser";
import { PAPER_RESULTS } from "@/lib/paper-results";

// W=20 warm-up 제외
const WARMUP_ROWS = 20;

const ABLATION_SETS: Record<
  AblationSetId,
  { label: string; features: string; color: string }
> = {
  "6f": {
    label: "6-feature",
    features:
      "tof_dist, residual, residual_var, residual_mean, signal_rate, range_status",
    color: "#2563eb",
  },
  "3f": {
    label: "3-feature",
    features: "residual, residual_var, residual_mean",
    color: "#d97706",
  },
};

const SET_ORDER: AblationSetId[] = ["6f", "3f"];

interface SlotMetrics {
  maeR: number | null;    // MAE(tinyml_R, cm_R)
  mapeR: number | null;   // MAPE(tinyml_R, cm_R)
  rowCount: number;
}

function hasFullTinyMLColumns(rows: KFRow[]): boolean {
  return rows.length > 0 && rows.every(
    (row) =>
      row.tinyml_estimate_mm !== undefined &&
      row.tinyml_R !== undefined &&
      row.tinyml_infer_us !== undefined,
  );
}

function computeMetrics(rows: KFRow[]): SlotMetrics {
  const sliced = rows.slice(WARMUP_ROWS);
  if (sliced.length === 0) return { maeR: null, mapeR: null, rowCount: rows.length };

  // tinyml_R이 없으면 null 반환
  const hasTinyml = sliced.every((r) => r.tinyml_R !== undefined);
  if (!hasTinyml) return { maeR: null, mapeR: null, rowCount: rows.length };

  const predR = sliced.map((r) => r.tinyml_R!);
  const labelR = sliced.map((r) => r.cm_R);

  const N = sliced.length;
  const maeR = predR.reduce((s, v, i) => s + Math.abs(v - labelR[i]), 0) / N;
  const mapeR =
    (predR.reduce((s, v, i) => {
      if (labelR[i] === 0) return s;
      return s + Math.abs(v - labelR[i]) / Math.abs(labelR[i]);
    }, 0) /
      N) *
    100;

  return { maeR, mapeR, rowCount: rows.length };
}

// 슬롯 업로드 카드 컴포넌트
function UploadSlot({ id }: { id: AblationSetId }) {
  const { slots, setSlot, removeSlot } = useAblationStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const meta = ABLATION_SETS[id];
  const uploaded = slots[id];

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result;
      if (typeof text !== "string") return;

      try {
        const rows = parseKFCSV(text);
        if (!hasFullTinyMLColumns(rows)) {
          throw new Error(
            "Ablation 슬롯은 tinyml_estimate_mm, tinyml_R, tinyml_infer_us가 포함된 28컬럼 CSV만 허용합니다.",
          );
        }
        setSlot(id, rows, file.name);
      } catch (err) {
        console.warn(`[ablation] CSV 파싱 실패 (${id}):`, err);
        alert(
          `CSV 파싱 오류: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    };
    reader.readAsText(file);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  return (
    <div
      className={`rounded-lg border p-5 shadow-sm transition-colors ${
        uploaded
          ? "border-[#bfdbfe] bg-white"
          : "border-[#d9e0ea] bg-[#f8fafc]"
      }`}
    >
      {/* 슬롯 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-[#111827]">
            {meta.label}
          </h3>
          <p className="mt-1 text-xs text-[#64748b]">{meta.features}</p>
        </div>
        {uploaded && (
          <span
            className="mt-0.5 rounded-full px-2 py-0.5 text-xs font-semibold"
            style={{ backgroundColor: `${meta.color}20`, color: meta.color }}
          >
            로드됨
          </span>
        )}
      </div>

      {/* 업로드 상태 */}
      {uploaded ? (
        <div className="mt-4 space-y-2">
          <p className="truncate text-sm font-medium text-[#334155]">
            {uploaded.fileName}
          </p>
          <p className="text-xs text-[#64748b]">{uploaded.rows.length}행</p>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => inputRef.current?.click()}
              className="rounded-md border border-[#d1d5db] bg-white px-3 py-1.5 text-xs font-medium text-[#374151] hover:bg-[#f9fafb]"
            >
              교체
            </button>
            <button
              onClick={() => removeSlot(id)}
              className="rounded-md border border-[#fca5a5] bg-white px-3 py-1.5 text-xs font-medium text-[#dc2626] hover:bg-[#fef2f2]"
            >
              제거
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <button
            onClick={() => inputRef.current?.click()}
            className="w-full rounded-md border-2 border-dashed border-[#cbd5e1] bg-white py-4 text-sm font-medium text-[#64748b] transition-colors hover:border-[#2563eb] hover:text-[#2563eb]"
          >
            CSV 파일 선택
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}

// 메트릭 테이블 컴포넌트
function MetricsTable({
  metrics,
}: {
  metrics: Partial<Record<AblationSetId, SlotMetrics>>;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-[#e2e8f0] text-sm">
        <thead>
          <tr className="bg-[#f8fafc]">
            <th className="px-4 py-3 text-left font-semibold text-[#374151]">
              Feature Set
            </th>
            <th className="px-4 py-3 text-right font-semibold text-[#374151]">
              MAE_R (mm²)
            </th>
            <th className="px-4 py-3 text-right font-semibold text-[#374151]">
              MAPE_R (%)
            </th>
            <th className="px-4 py-3 text-right font-semibold text-[#374151]">
              Row count
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f5f9] bg-white">
          {SET_ORDER.map((id) => {
            const m = metrics[id];
            const meta = ABLATION_SETS[id];
            if (!m) return null;

            return (
              <tr key={id} className="hover:bg-[#f8fafc]">
                <td className="px-4 py-3">
                  <span className="font-medium" style={{ color: meta.color }}>
                    {meta.label}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-[#111827]">
                  {m.maeR != null ? m.maeR.toFixed(2) : "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[#111827]">
                  {m.mapeR != null ? `${m.mapeR.toFixed(1)}%` : "—"}
                </td>
                <td className="px-4 py-3 text-right text-[#64748b]">
                  {m.rowCount.toLocaleString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// MAE_R 바 차트 컴포넌트
function MaeRBarChart({
  metrics,
}: {
  metrics: Partial<Record<AblationSetId, SlotMetrics>>;
}) {
  const data = SET_ORDER.flatMap((id) => {
    const m = metrics[id];
    if (!m || m.maeR == null) return [];
    return [{ name: ABLATION_SETS[id].label, maeR: m.maeR, id }];
  });

  if (data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={data}
        margin={{ top: 10, right: 24, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 12, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#64748b" }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => `${v.toFixed(0)}`}
          label={{
            value: "MAE_R (mm²)",
            angle: -90,
            position: "insideLeft",
            offset: 4,
            style: { fontSize: 11, fill: "#94a3b8" },
          }}
        />
        <Tooltip
          formatter={(value) => {
            const num = typeof value === "number" ? value : Number(value);
            return [`${num.toFixed(2)} mm²`, "MAE_R"];
          }}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: 12,
          }}
        />
        <Bar dataKey="maeR" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.id} fill={ABLATION_SETS[entry.id].color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// 표 4-10 하드코딩 카드 (논문 확정값 — 슬롯 업로드 여부와 무관하게 항상 표시)
function Table4_10Card() {
  const { TABLE_4_10 } = PAPER_RESULTS;
  return (
    <div className="rounded-lg border border-[#d9e0ea] bg-white shadow-sm">
      <div className="border-b border-[#f1f5f9] px-6 py-4">
        <h3 className="text-base font-semibold text-[#111827]">{TABLE_4_10.title}</h3>
        <p className="mt-0.5 text-xs text-[#94a3b8]">{TABLE_4_10.description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#e2e8f0] text-sm">
          <thead>
            <tr className="bg-[#f8fafc]">
              <th className="px-4 py-3 text-left font-semibold text-[#374151]">Feature Set</th>
              <th className="px-4 py-3 text-right font-semibold text-[#374151]">Params</th>
              <th className="px-4 py-3 text-right font-semibold text-[#374151]">TFLite (KB)</th>
              <th className="px-4 py-3 text-right font-semibold text-[#374151]">MAE_R f32 (mm²)</th>
              <th className="px-4 py-3 text-right font-semibold text-[#374151]">MAPE_R f32 (%)</th>
              <th className="px-4 py-3 text-right font-semibold text-[#374151]">MAE_R int8 (mm²)</th>
              <th className="px-4 py-3 text-right font-semibold text-[#374151]">int8 Delta (%)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9] bg-white">
            {TABLE_4_10.rows.map((row) => (
              <tr key={row.featureSet} className="hover:bg-[#f8fafc]">
                <td className="px-4 py-3">
                  <p className="font-medium text-[#111827]">{row.featureSet}</p>
                  <p className="text-xs text-[#94a3b8]">{row.features}</p>
                </td>
                <td className="px-4 py-3 text-right font-mono text-[#111827]">{row.params}</td>
                <td className="px-4 py-3 text-right font-mono text-[#111827]">{row.tfliteKB.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-mono text-[#111827]">{row.maeR_f32.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-mono text-[#111827]">{row.mapeR_f32.toFixed(1)}</td>
                <td className="px-4 py-3 text-right font-mono text-[#111827]">{row.maeR_int8.toFixed(2)}</td>
                <td
                  className="px-4 py-3 text-right font-mono"
                  style={{ color: row.int8DeltaPct < 0 ? "#16a34a" : "#dc2626" }}
                >
                  {row.int8DeltaPct > 0 ? "+" : ""}{row.int8DeltaPct.toFixed(1)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-3 text-xs text-[#64748b]">
        6-feature: maeR 절댓값은 낮지만 mapeR은 높음 (cm_R 스케일 의존). 3-feature ablation 시 maeR 8.5% 증가, 파라미터 19% 감소.
      </div>
    </div>
  );
}

// 표 5-3 하드코딩 카드 (3-feature hold-out 위치 RMSE — 항상 표시)
function Table5_3Card() {
  const { TABLE_5_3 } = PAPER_RESULTS;
  return (
    <div className="rounded-lg border border-[#d9e0ea] bg-white shadow-sm">
      <div className="border-b border-[#f1f5f9] px-6 py-4">
        <h3 className="text-base font-semibold text-[#111827]">{TABLE_5_3.title}</h3>
        <p className="mt-0.5 text-xs text-[#94a3b8]">{TABLE_5_3.description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#e2e8f0] text-sm">
          <thead>
            <tr className="bg-[#f8fafc]">
              <th className="px-4 py-3 text-left font-semibold text-[#374151]">시나리오</th>
              <th className="px-4 py-3 text-right font-semibold text-[#374151]">N</th>
              <th className="px-4 py-3 text-right font-semibold text-[#10b981]">Fixed KF</th>
              <th className="px-4 py-3 text-right font-semibold text-[#2563eb]">CM-AKF</th>
              <th className="px-4 py-3 text-right font-semibold text-[#7c3aed]">TinyML 3f</th>
              <th className="px-4 py-3 text-right font-semibold text-[#374151]">CM vs 3f</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f5f9] bg-white">
            {TABLE_5_3.rows.map((row, idx) => (
              <tr key={row.scenario} className={idx % 2 === 1 ? "bg-[#fafafa]" : ""}>
                <td className="px-4 py-3">
                  <p className="font-medium text-[#111827]">{row.scenario}</p>
                  {"diverged" in row && row.diverged && (
                    <p className="text-xs text-[#dc2626]">⚠ 3f 모델 폭발</p>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-[#64748b]">{row.n}</td>
                <td className="px-4 py-3 text-right font-mono text-[#10b981]">{row.fixed.toFixed(2)}</td>
                <td className="px-4 py-3 text-right font-mono text-[#2563eb]">{row.cm.toFixed(2)}</td>
                <td
                  className="px-4 py-3 text-right font-mono"
                  style={{
                    color: "diverged" in row && row.diverged ? "#dc2626" : "#7c3aed",
                    fontWeight: "diverged" in row && row.diverged ? 700 : 400,
                  }}
                >
                  {row.tinyml3f.toFixed(2)}
                  {"diverged" in row && row.diverged && " ★"}
                </td>
                <td
                  className="px-4 py-3 text-right font-mono"
                  style={{ color: row.cmVs3fDiff > 0 ? "#dc2626" : "#16a34a" }}
                >
                  {row.cmVs3fDiff > 0 ? "+" : ""}{row.cmVs3fDiff.toFixed(2)}
                </td>
              </tr>
            ))}
            {/* 가중 평균 행 */}
            <tr className="border-t-2 border-[#d9e0ea] bg-[#f8fafc] font-semibold">
              <td className="px-4 py-3 text-[#111827]">가중 평균 (N={TABLE_5_3.weightedAvg.n})</td>
              <td className="px-4 py-3 text-right text-[#64748b]">{TABLE_5_3.weightedAvg.n}</td>
              <td className="px-4 py-3 text-right font-mono text-[#10b981]">
                {TABLE_5_3.weightedAvg.fixed.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-[#2563eb]">
                {TABLE_5_3.weightedAvg.cm.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-[#dc2626]">
                {TABLE_5_3.weightedAvg.tinyml3f.toFixed(2)}
              </td>
              <td className="px-4 py-3 text-right font-mono text-[#dc2626]">
                +{TABLE_5_3.weightedAvg.cmVs3fDiff.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="space-y-1 px-6 py-3 text-xs text-[#64748b]">
        <p>단위: mm (위치 RMSE). CM vs 3f: 양수 = 3f가 CM보다 높음 (성능 열화).</p>
        <p>
          ⚠ E2 acryl run03: 3-feature 모델이 {TABLE_5_3.rows[2].tinyml3f.toFixed(0)}mm RMSE로 폭발 — signal_rate 제거의 위험성 입증.
        </p>
        <p>{TABLE_5_3.note}</p>
      </div>
    </div>
  );
}

// 메인 페이지
export default function AblationPage() {
  const { slots, clearAll } = useAblationStore();

  // 슬롯별 메트릭 계산
  const metrics = useMemo(() => {
    const result: Partial<Record<AblationSetId, SlotMetrics>> = {};
    for (const id of SET_ORDER) {
      const slot = slots[id];
      if (slot) result[id] = computeMetrics(slot.rows);
    }
    return result;
  }, [slots]);

  const hasAnySlot = SET_ORDER.some((id) => slots[id] != null);
  const filledCount = SET_ORDER.filter((id) => slots[id] != null).length;

  return (
    <div className="space-y-6">
      {/* 헤더 섹션 */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
          Ablation Study
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[#111827]">
          Feature set 비교
        </h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748b]">
          논문 기준: TinyML-AKF 입력 feature를 6개(메인) / 3개(잔차 통계만)로
          줄였을 때의 R 라벨 추적도(MAE_R/MAPE_R) 변화를 비교합니다.
          각 feature set으로 훈련된 모델의 추론 결과 CSV(28컬럼)를 슬롯에 업로드하세요.
          25컬럼 Fixed/CM CSV는 ablation 라벨 추적도를 계산할 수 없어 거부됩니다.
        </p>

        {/* 논문 기준 배너 */}
        <div className="mt-4 rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-xs text-[#1e40af]">
          W=20 warm-up 구간(초기 100 ms) 제외 후 계산 ·
          메트릭 기준: MAE_R = mean(|tinyml_R − cm_R|), MAPE_R = mean(|tinyml_R − cm_R| / cm_R) × 100
        </div>
      </section>

      {/* 업로드 섹션 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#374151]">
            CSV 업로드{" "}
            <span className="ml-1 text-[#94a3b8]">({filledCount}/2)</span>
          </h3>
          {hasAnySlot && (
            <button
              onClick={clearAll}
              className="text-xs font-medium text-[#ef4444] hover:underline"
            >
              전체 초기화
            </button>
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {SET_ORDER.map((id) => (
            <UploadSlot key={id} id={id} />
          ))}
        </div>
      </section>

      {/* 비교 섹션: 슬롯이 하나라도 채워지면 표시 */}
      {hasAnySlot ? (
        <section className="space-y-4">
          {/* 메트릭 테이블 */}
          <div className="rounded-lg border border-[#d9e0ea] bg-white shadow-sm">
            <div className="border-b border-[#f1f5f9] px-6 py-4">
              <h3 className="text-base font-semibold text-[#111827]">
                MAE_R / MAPE_R 비교
              </h3>
              <p className="mt-0.5 text-xs text-[#94a3b8]">
                warm-up {WARMUP_ROWS}행 제외 기준 · tinyml_R vs cm_R 라벨 추적도
              </p>
            </div>
            <MetricsTable metrics={metrics} />
          </div>

          {/* MAE_R 바 차트 */}
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-[#111827]">
              MAE_R 비교 (막대 그래프)
            </h3>
            <p className="mt-0.5 text-xs text-[#94a3b8]">
              데이터가 있는 슬롯만 표시됩니다.
            </p>
            <div className="mt-4">
              <MaeRBarChart metrics={metrics} />
            </div>
          </div>
        </section>
      ) : (
        /* 빈 상태 안내 */
        <section className="rounded-lg border border-[#d9e0ea] bg-[#f8fafc] p-8 text-center shadow-sm">
          <p className="text-base font-medium text-[#94a3b8]">
            CSV를 업로드하면 비교 결과가 표시됩니다
          </p>
          <p className="mt-2 text-sm text-[#cbd5e1]">
            슬롯에 각 feature set 추론 결과 CSV(28컬럼)를 업로드하세요.
          </p>
        </section>
      )}

      {/* 표 4-10 — 논문 확정값 (항상 표시) */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-[#374151]">
          논문 확정 결과 — 표 4-10
        </h3>
        <Table4_10Card />
      </section>

      {/* 표 5-3 — 3-feature hold-out 위치 RMSE (항상 표시) */}
      <section>
        <h3 className="mb-3 text-sm font-semibold text-[#374151]">
          논문 확정 결과 — 표 5-3
        </h3>
        <Table5_3Card />
      </section>
    </div>
  );
}
