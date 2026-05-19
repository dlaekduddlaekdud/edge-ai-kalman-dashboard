"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import { parseKFCSV } from "@/lib/csv-parser";
import { useKFStore, resolveAlgorithmUpload } from "@/lib/store";
import {
  ALL_SCENARIOS,
  SCENARIO_ALGORITHM_SLOTS,
  ALGORITHM_LABELS,
  type AlgorithmId,
  type ScenarioLabel,
} from "@/lib/dataset";

// ── 슬롯 배지 색상 ────────────────────────────────────────────────
const SLOT_COLORS: Record<AlgorithmId, { bg: string; text: string; border: string }> = {
  raw:    { bg: "#fff7ed", text: "#9a3412", border: "#fed7aa" },
  fixed:  { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe" },
  cm:     { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" },
  tinyml: { bg: "#faf5ff", text: "#7e22ce", border: "#e9d5ff" },
};

function SlotBadge({ id }: { id: AlgorithmId }) {
  const c = SLOT_COLORS[id];
  return (
    <span
      style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}` }}
      className="rounded-md px-2 py-0.5 text-xs font-semibold"
    >
      {ALGORITHM_LABELS[id]}
    </span>
  );
}

interface SlotState {
  fileName: string | null;
  rowCount: number | null;
  error: string | null;
  loading: boolean;
}

function emptySlot(): SlotState {
  return { fileName: null, rowCount: null, error: null, loading: false };
}

export default function UploadPage() {
  const { activeScenario, algorithms, setActiveScenario, setAlgorithmData, removeAlgorithmData } =
    useKFStore();

  const [slotStates, setSlotStates] = useState<Partial<Record<AlgorithmId, SlotState>>>({});

  const slots = SCENARIO_ALGORITHM_SLOTS[activeScenario];

  function getSlotState(id: AlgorithmId): SlotState {
    return slotStates[id] ?? emptySlot();
  }

  function patchSlotState(id: AlgorithmId, patch: Partial<SlotState>) {
    setSlotStates((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? emptySlot()), ...patch },
    }));
  }

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
    expectedId: AlgorithmId
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일명에서 알고리즘/시나리오 파싱
    const resolved = resolveAlgorithmUpload(file.name);

    if (!resolved) {
      patchSlotState(expectedId, {
        error: `파일명에서 알고리즘/시나리오를 파싱할 수 없습니다. (예: E1_run1_${expectedId}.csv)`,
        loading: false,
        fileName: null,
        rowCount: null,
      });
      event.target.value = "";
      return;
    }

    if (resolved.algorithmId !== expectedId) {
      patchSlotState(expectedId, {
        error: `이 슬롯은 "${ALGORITHM_LABELS[expectedId]}" 파일만 허용합니다. (감지된 알고리즘: ${resolved.algorithmId})`,
        loading: false,
        fileName: null,
        rowCount: null,
      });
      event.target.value = "";
      return;
    }

    if (resolved.scenario !== activeScenario) {
      patchSlotState(expectedId, {
        error: `현재 시나리오(${activeScenario})와 파일의 시나리오(${resolved.scenario})가 다릅니다.`,
        loading: false,
        fileName: null,
        rowCount: null,
      });
      event.target.value = "";
      return;
    }

    patchSlotState(expectedId, { loading: true, error: null });

    try {
      const csvText = await file.text();
      const rows = parseKFCSV(csvText);
      setAlgorithmData(expectedId, rows, file.name);
      patchSlotState(expectedId, {
        loading: false,
        fileName: file.name,
        rowCount: rows.length,
        error: null,
      });
      // store에 저장 후 콘솔 확인 (Day 1 검증용)
      console.log(`[upload] ${expectedId} loaded: ${rows.length} rows`, {
        scenario: activeScenario,
        sampleIndex0: rows[0],
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "CSV 파싱 오류";
      patchSlotState(expectedId, { loading: false, error: message, fileName: null, rowCount: null });
      removeAlgorithmData(expectedId);
    } finally {
      event.target.value = "";
    }
  }

  function handleScenarioChange(scenario: ScenarioLabel) {
    setActiveScenario(scenario);
    setSlotStates({});
  }

  // 업로드된 슬롯 수 (행 수 일치 여부 경고용)
  const uploadedSlots = Object.entries(algorithms).filter(([, v]) => v !== undefined);
  const rowCounts = uploadedSlots.map(([, v]) => v!.rows.length);
  const rowMismatch = rowCounts.length > 1 && new Set(rowCounts).size > 1;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
          Upload
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[#111827]">
          알고리즘별 CSV 업로드
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#475569]">
          시나리오를 선택한 뒤 알고리즘별 슬롯에 CSV를 업로드하세요. 파일명은{" "}
          <code className="rounded bg-[#f1f5f9] px-1 text-sm">
            {"{scenario}_run{N}_{algorithm}.csv"}
          </code>{" "}
          규칙을 따라야 합니다.
        </p>
      </section>

      {/* 시나리오 선택 */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#111827]">시나리오 선택</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {ALL_SCENARIOS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleScenarioChange(s)}
              className={`rounded-lg border px-5 py-2 text-sm font-semibold transition ${
                activeScenario === s
                  ? "border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]"
                  : "border-[#d9e0ea] bg-white text-[#475569] hover:border-[#94a3b8]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <p className="mt-3 text-sm text-[#64748b]">
          {activeScenario === "E0"
            ? "E0: 합성 데이터 — fixed 슬롯 1개"
            : `${activeScenario}: 실측 데이터 — raw / fixed / cm / tinyml 4개 슬롯`}
        </p>
      </section>

      {/* 알고리즘 슬롯 */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-[#111827]">
          {activeScenario} 알고리즘 슬롯
        </h3>

        {rowMismatch && (
          <div className="mt-4 rounded-lg border border-[#fecaca] bg-[#fff7f7] px-4 py-3">
            <p className="text-sm font-semibold text-[#dc2626]">행 수 불일치 경고</p>
            <p className="mt-1 text-sm text-[#7f1d1d]">
              업로드된 CSV 간 행 수가 다릅니다 (
              {uploadedSlots
                .map(([id, v]) => `${id}: ${v!.rows.length}행`)
                .join(", ")}
              ). 동일 시나리오·동일 run의 파일인지 확인하세요.
            </p>
          </div>
        )}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {slots.map((id) => {
            const slot = getSlotState(id);
            const uploaded = algorithms[id];
            const c = SLOT_COLORS[id];

            return (
              <div
                key={id}
                style={{ borderColor: uploaded ? c.border : "#d9e0ea" }}
                className="rounded-lg border bg-white p-5"
              >
                <div className="flex items-center justify-between">
                  <SlotBadge id={id} />
                  {uploaded && (
                    <button
                      type="button"
                      onClick={() => {
                        removeAlgorithmData(id);
                        patchSlotState(id, emptySlot());
                      }}
                      className="text-xs text-[#94a3b8] hover:text-[#64748b]"
                    >
                      제거
                    </button>
                  )}
                </div>

                <p className="mt-2 text-xs text-[#64748b]">
                  예: {activeScenario}_run1_{id}.csv
                </p>

                {slot.loading ? (
                  <p className="mt-4 text-sm text-[#64748b]">파싱 중...</p>
                ) : uploaded ? (
                  <div className="mt-4 space-y-1">
                    <p className="text-sm font-semibold text-[#111827]">{uploaded.fileName}</p>
                    <p className="text-sm text-[#16a34a]">{uploaded.rows.length}행 로드됨</p>
                  </div>
                ) : (
                  <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#94a3b8] bg-[#f8fafc] px-4 py-6 text-center transition hover:border-[#2563eb] hover:bg-[#eff6ff]">
                    <span className="text-sm font-semibold text-[#1d4ed8]">CSV 선택</span>
                    <span className="mt-1 text-xs text-[#94a3b8]">.csv</span>
                    <input
                      type="file"
                      accept=".csv,text/csv"
                      onChange={(e) => handleFileChange(e, id)}
                      className="sr-only"
                    />
                  </label>
                )}

                {slot.error && (
                  <p className="mt-3 rounded-md bg-[#fff7f7] px-3 py-2 text-xs text-[#dc2626]">
                    {slot.error}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 업로드 현황 요약 */}
      {uploadedSlots.length > 0 && (
        <section className="rounded-lg border border-[#bbf7d0] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#16a34a]">
            업로드 현황
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {uploadedSlots.map(([id, data]) => (
              <div key={id} className="rounded-lg border border-[#d9e0ea] bg-[#f8fafc] p-4">
                <SlotBadge id={id as AlgorithmId} />
                <p className="mt-2 text-xs text-[#64748b]">{data!.fileName}</p>
                <p className="mt-1 text-lg font-semibold text-[#111827]">
                  {data!.rows.length}행
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end">
            <Link
              href="/dashboard"
              className="rounded-md bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
            >
              대시보드에서 확인하기 →
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
