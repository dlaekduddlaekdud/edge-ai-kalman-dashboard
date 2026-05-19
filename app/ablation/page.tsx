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
import { parseKFCSV } from "@/lib/csv-parser";
import { calculateRMSE, calculateMAE } from "@/lib/metrics";

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
  "5f": {
    label: "5-feature",
    features: "signal_rate 제외",
    color: "#16a34a",
  },
  "3f": {
    label: "3-feature",
    features: "residual, residual_var, residual_mean",
    color: "#d97706",
  },
};

const SET_ORDER: AblationSetId[] = ["6f", "5f", "3f"];

interface SlotMetrics {
  rmse: number | null;
  mae: number | null;
  rowCount: number;
}

function computeMetrics(rows: import("@/lib/csv-parser").KFRow[]): SlotMetrics {
  const sliced = rows.slice(WARMUP_ROWS);
  const rowCount = sliced.length;

  if (rowCount === 0) {
    return { rmse: null, mae: null, rowCount: rows.length };
  }

  const estimates = sliced.map((r) => r.kf_estimate_mm);
  const gt = sliced.map((r) => r.gt_distance_mm);

  let rmse: number | null = null;
  let mae: number | null = null;

  try {
    rmse = calculateRMSE(estimates, gt);
  } catch (err) {
    console.warn("[ablation] RMSE 계산 실패:", err);
  }

  try {
    mae = calculateMAE(estimates, gt);
  } catch (err) {
    console.warn("[ablation] MAE 계산 실패:", err);
  }

  return { rmse, mae, rowCount: rows.length };
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
    // input 초기화 (같은 파일 재업로드 허용)
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
              RMSE (mm)
            </th>
            <th className="px-4 py-3 text-right font-semibold text-[#374151]">
              MAE (mm)
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
                  {m.rmse != null ? m.rmse.toFixed(3) : "—"}
                </td>
                <td className="px-4 py-3 text-right font-mono text-[#111827]">
                  {m.mae != null ? m.mae.toFixed(3) : "—"}
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

// RMSE BarChart 컴포넌트
function RmseBarChart({
  metrics,
}: {
  metrics: Partial<Record<AblationSetId, SlotMetrics>>;
}) {
  const data = SET_ORDER.flatMap((id) => {
    const m = metrics[id];
    if (!m || m.rmse == null) return [];
    return [{ name: ABLATION_SETS[id].label, rmse: m.rmse, id }];
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
          tickFormatter={(v: number) => `${v.toFixed(1)}`}
          label={{
            value: "RMSE (mm)",
            angle: -90,
            position: "insideLeft",
            offset: 4,
            style: { fontSize: 11, fill: "#94a3b8" },
          }}
        />
        <Tooltip
          formatter={(value) => {
            const num = typeof value === "number" ? value : Number(value);
            return [`${num.toFixed(3)} mm`, "RMSE"];
          }}
          contentStyle={{
            borderRadius: 8,
            border: "1px solid #e2e8f0",
            fontSize: 12,
          }}
        />
        <Bar dataKey="rmse" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.id} fill={ABLATION_SETS[entry.id].color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
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
          논문 기준: TinyML-AKF 입력 feature를 6개 / 5개(signal_rate 제외) /
          3개(잔차 통계만) 로 줄였을 때의 RMSE·MAE 변화를 비교합니다. 각
          feature set으로 훈련된 모델의 추론 결과 CSV를 슬롯에 업로드하세요.
        </p>

        {/* 논문 기준 배너 */}
        <div className="mt-4 rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-xs text-[#1e40af]">
          W=20 warm-up 구간(초기 100 ms) 제외 후 계산 · 메트릭 기준: 논문
          4.3.1 RMSE = sqrt(1/N · sum((x_hat - x_gt)^2))
        </div>
      </section>

      {/* 업로드 섹션 */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#374151]">
            CSV 업로드{" "}
            <span className="ml-1 text-[#94a3b8]">({filledCount}/3)</span>
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
        <div className="grid gap-4 md:grid-cols-3">
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
                RMSE / MAE 비교
              </h3>
              <p className="mt-0.5 text-xs text-[#94a3b8]">
                warm-up {WARMUP_ROWS}행 제외 기준
              </p>
            </div>
            <MetricsTable metrics={metrics} />
          </div>

          {/* RMSE 바 차트 */}
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-[#111827]">
              RMSE 비교 (막대 그래프)
            </h3>
            <p className="mt-0.5 text-xs text-[#94a3b8]">
              데이터가 있는 슬롯만 표시됩니다.
            </p>
            <div className="mt-4">
              <RmseBarChart metrics={metrics} />
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
            슬롯에 각 feature set 추론 결과 CSV를 업로드하세요.
          </p>
        </section>
      )}
    </div>
  );
}
