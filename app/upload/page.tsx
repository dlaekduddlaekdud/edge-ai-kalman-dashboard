"use client";

import { ChangeEvent, useRef, useState } from "react";
import Link from "next/link";
import {
  parseE1CSV,
  parseRunFromFileName,
  ALL_RUNS,
  RUN_LABELS,
  type RunId,
} from "@/lib/e1-csv-parser";
import { useE1Store, type E2Surface } from "@/lib/e1-store";
import { PAPER_RESULTS } from "@/lib/paper-results";
import type { ScenarioLabel } from "@/lib/dataset";
import E1View from "@/components/views/E1View";
import E2View from "@/components/views/E2View";
import E3View from "@/components/views/E3View";
import E4View from "@/components/views/E4View";
import E5View from "@/components/views/E5View";

// ── 시나리오별 설정 ─────────────────────────────────────────────────────────

interface ScenarioCfg {
  label: ScenarioLabel;
  title: string;
  desc: string;
  /** null = CSV 없음 (E4 등) */
  files: { runId: RunId; path: string }[] | null;
}

type DataKey = "E1" | "E2_white" | "E2_black" | "E2_acryl" | "E3" | "E4" | "E5";

const DATA_FILES: Record<DataKey, { runId: RunId; path: string }[]> = {
  E1:       Array.from({ length: 5 }, (_, i) => ({ runId: `run${i + 1}` as RunId, path: `/data/E1_run0${i + 1}.csv` })),
  E2_white: Array.from({ length: 3 }, (_, i) => ({ runId: `run${i + 1}` as RunId, path: `/data/E2_white_run0${i + 1}.csv` })),
  E2_black: Array.from({ length: 3 }, (_, i) => ({ runId: `run${i + 1}` as RunId, path: `/data/E2_black_run0${i + 1}.csv` })),
  E2_acryl: Array.from({ length: 3 }, (_, i) => ({ runId: `run${i + 1}` as RunId, path: `/data/E2_acryl_run0${i + 1}.csv` })),
  E3:       Array.from({ length: 5 }, (_, i) => ({ runId: `run${i + 1}` as RunId, path: `/data/E3_run0${i + 1}.csv` })),
  E4:       Array.from({ length: 3 }, (_, i) => ({ runId: `run${i + 1}` as RunId, path: `/data/E4_run0${i + 1}.csv` })),
  E5:       Array.from({ length: 5 }, (_, i) => ({ runId: `run${i + 1}` as RunId, path: `/data/E5_run0${i + 1}.csv` })),
};

const E2_SURFACES: { key: E2Surface; label: string; subDesc: string }[] = [
  { key: "white", label: "흰 우드락",   subDesc: `RMSE: CM ${PAPER_RESULTS.E2.surfaces.white.cm.rmse} mm` },
  { key: "black", label: "검정 우드락", subDesc: `RMSE: CM ${PAPER_RESULTS.E2.surfaces.black.cm.rmse} mm` },
  { key: "acryl", label: "투명 아크릴", subDesc: `RMSE: TinyML Best ${PAPER_RESULTS.E2.surfaces.acryl.tinyml.rmse} mm ★` },
];

const SCENARIOS: ScenarioCfg[] = [
  { label: "E1", title: "E1 — 정상 baseline",      desc: "5 run · ~1,167 frames",      files: DATA_FILES.E1 },
  { label: "E2", title: "E2 — 벽 재질별",           desc: "3 surface × 3 run",           files: DATA_FILES.E2_white },
  { label: "E3", title: "E3 — ToF 차단 구간",       desc: "5 run · ~1,152 frames",      files: DATA_FILES.E3 },
  { label: "E4", title: "E4 — 정적 장기 안정성",    desc: "3 run · 30분 정적",          files: DATA_FILES.E4 },
  { label: "E5", title: "E5 — 미지 표면 일반화",    desc: "5 run · ~963 frames",         files: DATA_FILES.E5 },
];

// ── 상태 타입 ───────────────────────────────────────────────────────────────

interface LoadState {
  loading: boolean;
  done: boolean;
  error: string | null;
  totalRows: number | null;
  durationMs: number | null;
}

function emptyLoadState(): LoadState {
  return { loading: false, done: false, error: null, totalRows: null, durationMs: null };
}

interface RunSlotState {
  fileName: string | null;
  rowCount: number | null;
  error: string | null;
  loading: boolean;
  parseDurationMs: number | null;
}

function emptyRunSlot(): RunSlotState {
  return { fileName: null, rowCount: null, error: null, loading: false, parseDurationMs: null };
}

function getSchemaLabel(rows: Array<{ tinyml_estimate_mm?: number }>): string {
  return rows.length > 0 && rows.every((row) => row.tinyml_estimate_mm !== undefined)
    ? "28컬럼 · TinyML 포함"
    : "25컬럼 · Fixed/CM";
}

// ── 컴포넌트 ────────────────────────────────────────────────────────────────

export default function DataPage() {
  const { runs, activeScenario, activeE2Surface, setRun, removeRun, setActiveScenario, setActiveE2Surface } =
    useE1Store();

  const [loadState, setLoadState] = useState<LoadState>(emptyLoadState());
  const [runSlotStates, setRunSlotStates] = useState<Partial<Record<RunId, RunSlotState>>>({});
  const [showManual, setShowManual] = useState(false);
  const [showInlineDashboard, setShowInlineDashboard] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  function patchRunSlotState(id: RunId, patch: Partial<RunSlotState>) {
    setRunSlotStates((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? emptyRunSlot()), ...patch },
    }));
  }

  // ── 시나리오 선택 ─────────────────────────────────────────────────────────
  function handleScenarioChange(scenario: ScenarioLabel) {
    setActiveScenario(scenario);
    setRunSlotStates({});
    setLoadState(emptyLoadState());
    setShowInlineDashboard(false);
  }

  // ── 데이터 자동 로드 ──────────────────────────────────────────────────────
  async function handleAutoLoad(files: { runId: RunId; path: string }[]) {
    setLoadState({ loading: true, done: false, error: null, totalRows: null, durationMs: null });
    const t0 = performance.now();

    try {
      const results = await Promise.all(
        files.map(async ({ runId, path }) => {
          const fileName = path.split("/").pop()!;
          const res = await fetch(path);
          if (!res.ok) throw new Error(`${fileName} 로드 실패 (${res.status})`);
          const text = await res.text();
          const rows = parseE1CSV(text);
          return { runId, rows, fileName };
        }),
      );

      const durationMs = Math.round(performance.now() - t0);
      const totalRows = results.reduce((s, r) => s + r.rows.length, 0);

      for (const { runId, rows, fileName } of results) {
        setRun(runId, rows, fileName);
        patchRunSlotState(runId, {
          loading: false, fileName, rowCount: rows.length,
          error: null, parseDurationMs: durationMs,
        });
      }

      setLoadState({ loading: false, done: true, error: null, totalRows, durationMs });
      setShowInlineDashboard(true);
      // 로드 완료 후 대시보드 섹션으로 스크롤
      setTimeout(() => {
        dashboardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      const message = err instanceof Error ? err.message : "데이터 로드 실패";
      setLoadState({ loading: false, done: false, error: message, totalRows: null, durationMs: null });
    }
  }

  // ── 현재 활성 파일 목록 결정 ──────────────────────────────────────────────
  function getActiveFiles(): { runId: RunId; path: string }[] | null {
    if (activeScenario === "E1") return DATA_FILES.E1;
    if (activeScenario === "E2") {
      const surface = activeE2Surface ?? "white";
      return DATA_FILES[`E2_${surface}`];
    }
    if (activeScenario === "E3") return DATA_FILES.E3;
    if (activeScenario === "E5") return DATA_FILES.E5;
    return null; // E0, E4
  }

  const activeFiles = getActiveFiles();
  const activeCfg = SCENARIOS.find((s) => s.label === activeScenario);
  const uploadedRuns = Object.entries(runs).filter(([, v]) => v !== undefined);
  const hasAnyRun = uploadedRuns.length > 0;

  // ── 수동 업로드 핸들러 ─────────────────────────────────────────────────────
  async function handleRunFileChange(event: ChangeEvent<HTMLInputElement>, expectedId: RunId) {
    const file = event.target.files?.[0];
    if (!file) return;

    const detectedRun = parseRunFromFileName(file.name);
    if (!detectedRun) {
      patchRunSlotState(expectedId, {
        error: `파일명에서 런 번호를 파싱할 수 없습니다. (예: ${activeScenario}_run01.csv)`,
        loading: false, fileName: null, rowCount: null, parseDurationMs: null,
      });
      event.target.value = "";
      return;
    }
    if (detectedRun !== expectedId) {
      patchRunSlotState(expectedId, {
        error: `이 슬롯은 ${RUN_LABELS[expectedId]} 파일만 허용합니다. (감지: ${RUN_LABELS[detectedRun]})`,
        loading: false, fileName: null, rowCount: null, parseDurationMs: null,
      });
      event.target.value = "";
      return;
    }

    patchRunSlotState(expectedId, { loading: true, error: null, parseDurationMs: null });
    try {
      const t0 = performance.now();
      const csvText = await file.text();
      const rows = parseE1CSV(csvText);
      const parseDurationMs = Math.round(performance.now() - t0);
      setRun(expectedId, rows, file.name);
      patchRunSlotState(expectedId, {
        loading: false, fileName: file.name,
        rowCount: rows.length, error: null, parseDurationMs,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "CSV 파싱 오류";
      patchRunSlotState(expectedId, {
        loading: false, error: message, fileName: null,
        rowCount: null, parseDurationMs: null,
      });
      removeRun(expectedId);
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">Data</p>
        <h2 className="mt-2 text-2xl font-semibold text-[#111827]">실험 데이터 선택</h2>
        <p className="mt-2 text-sm text-[#64748b]">
          시나리오를 선택하면 실제 STM32 실험 CSV를 자동 파싱해 대시보드에 표시합니다.
        </p>
      </section>

      {/* 시나리오 선택 */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
          시나리오 선택
        </p>
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map(({ label, title, desc }) => (
            <button
              key={label}
              type="button"
              onClick={() => handleScenarioChange(label)}
              className={`rounded-lg border px-4 py-3 text-left transition ${
                activeScenario === label
                  ? "border-[#2563eb] bg-[#eff6ff]"
                  : "border-[#d9e0ea] bg-white hover:border-[#94a3b8]"
              }`}
            >
              <p className={`text-sm font-semibold ${activeScenario === label ? "text-[#1d4ed8]" : "text-[#111827]"}`}>
                {label}
              </p>
              <p className="mt-0.5 text-xs text-[#64748b]">{title.replace(`${label} — `, "")}</p>
              <p className="mt-0.5 text-[11px] text-[#94a3b8]">{desc}</p>
            </button>
          ))}
        </div>

        {/* E2 표면 선택 */}
        {activeScenario === "E2" && (
          <div className="mt-4 border-t border-[#e2e8f0] pt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
              E2 표면 선택
            </p>
            <div className="flex flex-wrap gap-2">
              {E2_SURFACES.map(({ key, label, subDesc }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setActiveE2Surface(key);
                    setLoadState(emptyLoadState());
                  }}
                  className={`rounded-lg border px-4 py-2.5 text-left transition ${
                    (activeE2Surface ?? "white") === key
                      ? "border-[#2563eb] bg-[#eff6ff]"
                      : "border-[#d9e0ea] bg-white hover:border-[#94a3b8]"
                  }`}
                >
                  <p className={`text-sm font-semibold ${(activeE2Surface ?? "white") === key ? "text-[#1d4ed8]" : "text-[#111827]"}`}>
                    {label}
                  </p>
                  <p className="mt-0.5 text-[11px] text-[#64748b]">{subDesc}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* E4 안내 */}
      {activeScenario === "E4" && (
        <section className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] p-6 shadow-sm">
          <p className="text-base font-semibold text-[#1d4ed8]">E4 — 정적 장기 안정성</p>
          <p className="mt-2 text-sm text-[#1e40af]">
            E4는 30분 정적 실험 데이터(~251,000행)로 공개 파일에 포함되지 않습니다.
            논문 확정값 카드로 대시보드에서 확인하세요.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-md bg-white p-3 text-center">
              <p className="text-xs text-[#64748b]">RMSE (CM-AKF)</p>
              <p className="mt-1 text-lg font-bold text-[#2563eb]">{PAPER_RESULTS.E4.cm.rmse} mm</p>
            </div>
            <div className="rounded-md bg-white p-3 text-center">
              <p className="text-xs text-[#64748b]">추론 시간</p>
              <p className="mt-1 text-lg font-bold text-[#16a34a]">{PAPER_RESULTS.E4.tinymlInferMean_us} µs</p>
            </div>
            <div className="rounded-md bg-white p-3 text-center">
              <p className="text-xs text-[#64748b]">오버런</p>
              <p className="mt-1 text-lg font-bold text-[#111827]">{PAPER_RESULTS.E4.overrunCount}건</p>
            </div>
          </div>
          <Link
            href="/dashboard"
            className="mt-4 inline-block rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
          >
            대시보드에서 확인하기 →
          </Link>
        </section>
      )}

      {/* 데이터 로드 */}
      {activeFiles && activeScenario !== "E4" && (
        <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#111827]">
                {activeCfg?.title}
                {activeScenario === "E2" && ` — ${E2_SURFACES.find((s) => s.key === (activeE2Surface ?? "white"))?.label}`}
              </p>
              <p className="mt-0.5 text-xs text-[#64748b]">
                {activeFiles.length}개 CSV · STM32 실험 원본
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleAutoLoad(activeFiles)}
              disabled={loadState.loading}
              className="flex items-center gap-2 rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loadState.loading ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  파싱 중...
                </>
              ) : (
                <>
                  <span>📂</span>
                  데이터 불러오기
                </>
              )}
            </button>
          </div>

          {/* 파일 목록 */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {activeFiles.map(({ path }) => (
              <span
                key={path}
                className="rounded border border-[#e2e8f0] bg-[#f8fafc] px-2 py-0.5 font-mono text-[11px] text-[#475569]"
              >
                {path.split("/").pop()}
              </span>
            ))}
          </div>

          {/* 로드 상태 */}
          {loadState.done && loadState.totalRows != null && (
            <div className="mt-4 flex items-center gap-2 rounded-md border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3">
              <span className="text-[#16a34a]">✓</span>
              <span className="text-sm font-medium text-[#15803d]">
                {loadState.totalRows.toLocaleString()}행 파싱 완료
                {loadState.durationMs != null && (
                  <span className="ml-2 rounded-full border border-[#bbf7d0] bg-white px-2 py-0.5 text-[11px] font-semibold text-[#15803d]">
                    {loadState.durationMs} ms
                  </span>
                )}
              </span>
            </div>
          )}
          {loadState.error && (
            <div className="mt-4 rounded-md border border-[#fecaca] bg-[#fff7f7] px-4 py-3">
              <p className="text-sm text-[#dc2626]">⚠ {loadState.error}</p>
            </div>
          )}

          {/* 로드 완료 후 아래 대시보드로 이동 안내 */}
          {loadState.done && !showInlineDashboard && (
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowInlineDashboard(true);
                  setTimeout(() => dashboardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
                }}
                className="rounded-md bg-[#2563eb] px-5 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8]"
              >
                대시보드 열기 ↓
              </button>
            </div>
          )}
        </section>
      )}

      {/* ── 인라인 대시보드 (데이터 로드 성공 후 표시) ── */}
      {showInlineDashboard && loadState.done && (
        <div ref={dashboardRef}>
          {/* 대시보드 헤더 */}
          <section className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#16a34a]">
                  분석 결과
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[#111827]">
                  {activeCfg?.title ?? activeScenario} 대시보드
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="rounded-md border border-[#2563eb] px-4 py-2 text-sm font-semibold text-[#2563eb] hover:bg-[#eff6ff]"
                >
                  전체 대시보드 →
                </Link>
                <button
                  type="button"
                  onClick={() => setShowInlineDashboard(false)}
                  className="rounded-md border border-[#d9e0ea] px-3 py-2 text-sm text-[#64748b] hover:bg-[#f8fafc]"
                >
                  닫기
                </button>
              </div>
            </div>
          </section>

          {/* 시나리오별 뷰 */}
          <section className="mt-4">
            {activeScenario === "E1" ? <E1View /> :
             activeScenario === "E2" ? <E2View /> :
             activeScenario === "E3" ? <E3View /> :
             activeScenario === "E4" ? <E4View /> :
             activeScenario === "E5" ? <E5View /> : null}
          </section>
        </div>
      )}

      {/* 고급: 직접 CSV 업로드 (collapse) */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setShowManual((v) => !v)}
          className="flex w-full items-center justify-between px-6 py-4 text-left"
        >
          <span className="text-sm font-semibold text-[#475569]">고급: 직접 CSV 업로드</span>
          <span className="text-[#94a3b8]">{showManual ? "▲" : "▼"}</span>
        </button>

        {showManual && (
          <div className="border-t border-[#e2e8f0] px-6 pb-6 pt-4">
            <p className="mb-4 text-sm text-[#64748b]">
              파일명은{" "}
              <code className="rounded bg-[#f1f5f9] px-1 text-sm">{"{시나리오}_run01.csv"}</code>{" "}
              형식이어야 합니다. 28컬럼 CSV는 TinyML 차트까지 활성화됩니다.
            </p>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {ALL_RUNS.map((runId) => {
                const slot = runSlotStates[runId] ?? emptyRunSlot();
                const uploaded = runs[runId];
                return (
                  <div
                    key={runId}
                    className={`rounded-lg border p-4 ${
                      uploaded ? "border-[#bbf7d0] bg-[#f0fdf4]" : "border-[#d9e0ea] bg-white"
                    }`}
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
                        {slot.parseDurationMs != null && (
                          <p className="text-[11px] text-[#94a3b8]">파싱 {slot.parseDurationMs} ms</p>
                        )}
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
          </div>
        )}
      </section>
    </div>
  );
}
