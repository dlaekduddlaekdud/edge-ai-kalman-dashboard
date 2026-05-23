"use client";

import { ChangeEvent, useState } from "react";
import Link from "next/link";
import { parseE1CSV, parseRunFromFileName, ALL_RUNS, RUN_LABELS, type RunId } from "@/lib/e1-csv-parser";
import { useE1Store } from "@/lib/e1-store";
import { ALL_SCENARIOS, parseScenarioFromFileName, type ScenarioLabel } from "@/lib/dataset";

// ── 런 슬롯 상태 ─────────────────────────────────────────────────────────
interface RunSlotState {
  fileName: string | null;
  rowCount: number | null;
  error: string | null;
  loading: boolean;
}

function emptyRunSlot(): RunSlotState {
  return { fileName: null, rowCount: null, error: null, loading: false };
}

function normalizeScenarioId(value: number | string): ScenarioLabel | null {
  if (typeof value === "number") {
    if (Number.isInteger(value) && value >= 0 && value <= 5) return `E${value}` as ScenarioLabel;
    return null;
  }

  const label = value.trim().toUpperCase();
  return /^E[0-5]$/.test(label) ? (label as ScenarioLabel) : null;
}

function findScenarioMismatch(
  rows: Array<{ scenario_id: number | string }>,
  expected: ScenarioLabel,
): { rowNumber: number; actual: string } | null {
  const idx = rows.findIndex((row) => normalizeScenarioId(row.scenario_id) !== expected);
  if (idx === -1) return null;
  return { rowNumber: idx + 2, actual: String(rows[idx].scenario_id) };
}

function getSchemaLabel(rows: Array<{ tinyml_estimate_mm?: number }>): string {
  return rows.length > 0 && rows.every((row) => row.tinyml_estimate_mm !== undefined)
    ? "28컬럼 · TinyML 포함"
    : "25컬럼 · Fixed/CM";
}

// ── 시나리오별 설명 ────────────────────────────────────────────────────────
const SCENARIO_DESCRIPTIONS: Record<ScenarioLabel, string> = {
  E0: "합성 데이터 — 업로드 불필요 (결과 카드로 표시됨)",
  E1: "런별 CSV 업로드 — 파일명: E1_run01.csv ~ E1_run05.csv",
  E2: "런별 CSV 업로드 — 파일명: E2_run01.csv ~ E2_run05.csv",
  E3: "런별 CSV 업로드 — 파일명: E3_run01.csv ~ E3_run05.csv",
  E4: "런별 CSV 업로드 — 파일명: E4_run01.csv ~ E4_run05.csv",
  E5: "런별 CSV 업로드 — 파일명: E5_run01.csv ~ E5_run05.csv",
};

export default function UploadPage() {
  const { runs, activeScenario, setRun, removeRun, setActiveScenario } = useE1Store();
  const [runSlotStates, setRunSlotStates] = useState<Partial<Record<RunId, RunSlotState>>>({});

  function patchRunSlotState(id: RunId, patch: Partial<RunSlotState>) {
    setRunSlotStates((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? emptyRunSlot()), ...patch },
    }));
  }

  async function handleRunFileChange(event: ChangeEvent<HTMLInputElement>, expectedId: RunId) {
    const file = event.target.files?.[0];
    if (!file) return;

    const detectedRun = parseRunFromFileName(file.name);
    if (!detectedRun) {
      patchRunSlotState(expectedId, {
        error: `파일명에서 런 번호를 파싱할 수 없습니다. (예: ${activeScenario}_run01.csv)`,
        loading: false, fileName: null, rowCount: null,
      });
      event.target.value = "";
      return;
    }
    if (detectedRun !== expectedId) {
      patchRunSlotState(expectedId, {
        error: `이 슬롯은 ${RUN_LABELS[expectedId]} 파일만 허용합니다. (감지: ${RUN_LABELS[detectedRun]})`,
        loading: false, fileName: null, rowCount: null,
      });
      event.target.value = "";
      return;
    }

    const detectedScenario = parseScenarioFromFileName(file.name);
    if (!detectedScenario) {
      patchRunSlotState(expectedId, {
        error: `파일명에서 시나리오를 파싱할 수 없습니다. (예: ${activeScenario}_run01.csv)`,
        loading: false, fileName: null, rowCount: null,
      });
      event.target.value = "";
      return;
    }
    if (detectedScenario !== activeScenario) {
      patchRunSlotState(expectedId, {
        error: `현재 선택은 ${activeScenario}입니다. ${detectedScenario} CSV는 ${detectedScenario} 선택 후 업로드하세요.`,
        loading: false, fileName: null, rowCount: null,
      });
      event.target.value = "";
      return;
    }

    patchRunSlotState(expectedId, { loading: true, error: null });
    try {
      const csvText = await file.text();
      const rows = parseE1CSV(csvText);
      const mismatch = findScenarioMismatch(rows, activeScenario);
      if (mismatch) {
        throw new Error(
          `CSV scenario_id가 현재 선택(${activeScenario})과 다릅니다. row ${mismatch.rowNumber}: ${mismatch.actual}`,
        );
      }
      setRun(expectedId, rows, file.name);
      patchRunSlotState(expectedId, {
        loading: false,
        fileName: file.name,
        rowCount: rows.length,
        error: null,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "CSV 파싱 오류";
      patchRunSlotState(expectedId, { loading: false, error: message, fileName: null, rowCount: null });
      removeRun(expectedId);
    } finally {
      event.target.value = "";
    }
  }

  function handleScenarioChange(scenario: ScenarioLabel) {
    setActiveScenario(scenario);
    setRunSlotStates({});
  }

  const uploadedRuns = Object.entries(runs).filter(([, v]) => v !== undefined);
  const rowCounts = uploadedRuns.map(([, v]) => v!.rows.length);
  const rowMismatch = rowCounts.length > 1 && new Set(rowCounts).size > 1;
  const hasAnyRun = uploadedRuns.length > 0;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
          Upload
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[#111827]">
          실험 CSV 업로드
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#475569]">
          시나리오를 선택한 뒤 런별 CSV를 업로드하세요.
          파일명은{" "}
          <code className="rounded bg-[#f1f5f9] px-1 text-sm">{"{시나리오}_run01.csv"}</code>{" "}
          형식이어야 합니다. E0는 합성 데이터로 업로드가 불필요합니다.
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
          {SCENARIO_DESCRIPTIONS[activeScenario]}
        </p>
      </section>

      {/* E0: 업로드 불필요 안내 */}
      {activeScenario === "E0" && (
        <section className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] p-6 shadow-sm">
          <p className="text-base font-semibold text-[#1d4ed8]">E0 — 합성 데이터</p>
          <p className="mt-2 text-sm text-[#1e40af]">
            E0는 Python 합성 시뮬레이션 결과로, 실제 CSV 업로드가 필요 없습니다.
            대시보드에서 논문 확정 수치 카드를 확인하세요.
          </p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
          >
            대시보드에서 확인하기 →
          </Link>
        </section>
      )}

      {/* E1~E5: 런별 슬롯 */}
      {activeScenario !== "E0" && (
        <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-[#111827]">
            {activeScenario} 런별 CSV 업로드
          </h3>
          <p className="mt-2 text-sm text-[#64748b]">
            파일명은{" "}
            <code className="rounded bg-[#f1f5f9] px-1 text-sm">
              {activeScenario}_run01.csv
            </code>{" "}
            형식이어야 합니다. 런 번호로 슬롯을 자동 배정합니다.
            25컬럼은 Fixed/CM 분석, 28컬럼은 TinyML 추정/R̂ 차트까지 활성화됩니다.
          </p>

          {rowMismatch && (
            <div className="mt-4 rounded-lg border border-[#fecaca] bg-[#fff7f7] px-4 py-3">
              <p className="text-sm font-semibold text-[#dc2626]">행 수 불일치 경고</p>
              <p className="mt-1 text-sm text-[#7f1d1d]">
                업로드된 CSV 간 행 수가 다릅니다 (
                {uploadedRuns
                  .map(([id, v]) => `${id}: ${v!.rows.length}행`)
                  .join(", ")}
                ). 동일 시나리오·동일 run의 파일인지 확인하세요.
              </p>
            </div>
          )}

          <div className="mt-5 grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {ALL_RUNS.map((runId) => {
              const slot = runSlotStates[runId] ?? emptyRunSlot();
              const uploaded = runs[runId];
              return (
                <div
                  key={runId}
                  className={`rounded-lg border p-4 ${uploaded ? "border-[#bbf7d0] bg-[#f0fdf4]" : "border-[#d9e0ea] bg-white"}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#111827]">
                      {RUN_LABELS[runId]}
                    </span>
                    {uploaded && (
                      <button
                        type="button"
                        onClick={() => {
                          removeRun(runId);
                          patchRunSlotState(runId, emptyRunSlot());
                        }}
                        className="text-xs text-[#94a3b8] hover:text-[#64748b]"
                      >
                        제거
                      </button>
                    )}
                  </div>
                  {slot.loading ? (
                    <p className="mt-3 text-xs text-[#64748b]">파싱 중...</p>
                  ) : uploaded ? (
                    <div className="mt-3 space-y-0.5">
                      <p className="truncate text-xs text-[#475569]">{uploaded.fileName}</p>
                      <p className="text-sm font-semibold text-[#16a34a]">{uploaded.rows.length}행</p>
                      <p className="text-[11px] font-medium text-[#64748b]">
                        {getSchemaLabel(uploaded.rows)}
                      </p>
                    </div>
                  ) : (
                    <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-[#94a3b8] bg-[#f8fafc] px-2 py-4 text-center hover:border-[#2563eb] hover:bg-[#eff6ff]">
                      <span className="text-xs font-semibold text-[#1d4ed8]">CSV 선택</span>
                      <input
                        type="file"
                        accept=".csv,text/csv"
                        onChange={(e) => handleRunFileChange(e, runId)}
                        className="sr-only"
                      />
                    </label>
                  )}
                  {slot.error && (
                    <p className="mt-2 rounded bg-[#fff7f7] px-2 py-1.5 text-[11px] text-[#dc2626]">
                      {slot.error}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {hasAnyRun && (
            <div className="mt-5 flex justify-end">
              <Link
                href="/dashboard"
                className="rounded-md bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
              >
                대시보드에서 확인하기 →
              </Link>
            </div>
          )}
        </section>
      )}

      {/* 업로드 현황 요약 */}
      {hasAnyRun && (
        <section className="rounded-lg border border-[#bbf7d0] bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#16a34a]">
            업로드 현황
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {uploadedRuns.map(([runId, data]) => (
              <div key={runId} className="rounded-lg border border-[#d9e0ea] bg-[#f8fafc] p-4">
                <p className="text-sm font-semibold text-[#111827]">{RUN_LABELS[runId as RunId]}</p>
                <p className="mt-1 text-xs text-[#64748b] truncate">{data!.fileName}</p>
                <p className="mt-1 text-lg font-semibold text-[#111827]">
                  {data!.rows.length}행
                </p>
                <p className="mt-1 text-xs text-[#64748b]">
                  {getSchemaLabel(data!.rows)}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
