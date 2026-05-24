"use client";

import { useEffect, useRef, useState } from "react";
import { parseE1CSV, type RunId } from "@/lib/e1-csv-parser";
import { useE1Store, type E2Surface } from "@/lib/e1-store";
import { PAPER_RESULTS } from "@/lib/paper-results";
import type { ScenarioLabel } from "@/lib/dataset";
import E1View from "@/components/views/E1View";
import E2View from "@/components/views/E2View";
import E3View from "@/components/views/E3View";
import E4View from "@/components/views/E4View";
import E5View from "@/components/views/E5View";

interface ScenarioCfg {
  label: Exclude<ScenarioLabel, "E0">;
  title: string;
  desc: string;
}

type DataKey = "E1" | "E2_white" | "E2_black" | "E2_acryl" | "E3" | "E5";

const DATA_FILES: Record<DataKey, { runId: RunId; path: string }[]> = {
  E1: Array.from({ length: 5 }, (_, i) => ({ runId: `run${i + 1}` as RunId, path: `/data/E1_run0${i + 1}.csv` })),
  E2_white: Array.from({ length: 3 }, (_, i) => ({ runId: `run${i + 1}` as RunId, path: `/data/E2_white_run0${i + 1}.csv` })),
  E2_black: Array.from({ length: 3 }, (_, i) => ({ runId: `run${i + 1}` as RunId, path: `/data/E2_black_run0${i + 1}.csv` })),
  E2_acryl: Array.from({ length: 3 }, (_, i) => ({ runId: `run${i + 1}` as RunId, path: `/data/E2_acryl_run0${i + 1}.csv` })),
  E3: Array.from({ length: 5 }, (_, i) => ({ runId: `run${i + 1}` as RunId, path: `/data/E3_run0${i + 1}.csv` })),
  E5: Array.from({ length: 5 }, (_, i) => ({ runId: `run${i + 1}` as RunId, path: `/data/E5_run0${i + 1}.csv` })),
};

const E2_SURFACES: { key: E2Surface; label: string; subDesc: string }[] = [
  { key: "white", label: "흰 우드락", subDesc: `CM-AKF ${PAPER_RESULTS.E2.surfaces.white.cm.rmse} mm` },
  { key: "black", label: "검정 우드락", subDesc: `CM-AKF ${PAPER_RESULTS.E2.surfaces.black.cm.rmse} mm` },
  { key: "acryl", label: "투명 아크릴", subDesc: `TinyML-AKF ${PAPER_RESULTS.E2.surfaces.acryl.tinyml.rmse} mm` },
];

const SCENARIOS: ScenarioCfg[] = [
  { label: "E1", title: "E1 — 정상 baseline", desc: "5 run · ~1,167 frames" },
  { label: "E2", title: "E2 — 벽 재질별", desc: "3 surface × 3 run" },
  { label: "E3", title: "E3 — ToF 차단 구간", desc: "5 run · ~1,152 frames" },
  { label: "E4", title: "E4 — 정적 장기 안정성", desc: "3 run · 30분 정적" },
  { label: "E5", title: "E5 — 미지 표면 일반화", desc: "5 run · ~963 frames" },
];

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

function getActiveFilesFor(
  scenario: ScenarioLabel,
  surface: E2Surface | null,
): { runId: RunId; path: string }[] | null {
  if (scenario === "E1") return DATA_FILES.E1;
  if (scenario === "E2") return DATA_FILES[`E2_${surface ?? "white"}`];
  if (scenario === "E3") return DATA_FILES.E3;
  if (scenario === "E5") return DATA_FILES.E5;
  return null;
}

function DashboardView({ scenario }: { scenario: ScenarioLabel }) {
  if (scenario === "E1") return <E1View />;
  if (scenario === "E2") return <E2View />;
  if (scenario === "E3") return <E3View />;
  if (scenario === "E4") return <E4View />;
  if (scenario === "E5") return <E5View />;
  return null;
}

export default function DataPage() {
  const {
    activeScenario,
    activeE2Surface,
    setRun,
    setActiveRun,
    setActiveScenario,
    setActiveE2Surface,
  } = useE1Store();

  const [loadState, setLoadState] = useState<LoadState>(emptyLoadState());
  const loadSeqRef = useRef(0);

  async function loadFiles(files: { runId: RunId; path: string }[]) {
    const loadSeq = loadSeqRef.current + 1;
    loadSeqRef.current = loadSeq;
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

      if (loadSeq !== loadSeqRef.current) return;

      for (const { runId, rows, fileName } of results) {
        setRun(runId, rows, fileName);
      }
      setActiveRun(results.length > 1 ? "all" : results[0]?.runId ?? "run1");

      setLoadState({
        loading: false,
        done: true,
        error: null,
        totalRows: results.reduce((sum, result) => sum + result.rows.length, 0),
        durationMs: Math.round(performance.now() - t0),
      });
    } catch (err) {
      if (loadSeq !== loadSeqRef.current) return;
      const message = err instanceof Error ? err.message : "데이터 로드 실패";
      setLoadState({ loading: false, done: false, error: message, totalRows: null, durationMs: null });
    }
  }

  useEffect(() => {
    const files = getActiveFilesFor(activeScenario, activeE2Surface);
    if (!files) {
      loadSeqRef.current += 1;
      setLoadState({ loading: false, done: true, error: null, totalRows: null, durationMs: null });
      return;
    }
    void loadFiles(files);
  }, [activeScenario, activeE2Surface]);

  const activeCfg = SCENARIOS.find((scenario) => scenario.label === activeScenario);
  const activeFiles = getActiveFilesFor(activeScenario, activeE2Surface);
  const currentSurface = activeE2Surface ?? "white";
  const dashboardReady = activeScenario === "E4" || loadState.done;

  return (
    <div className="space-y-7">
      <section className="rounded-lg border border-[#d1d5db] bg-white p-7 shadow-sm">
        <p className="text-base font-bold uppercase tracking-[0.14em] text-[#111827]">Data</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-[#111827]">실험 데이터 선택</h2>
        <p className="mt-4 text-lg leading-8 text-[#4b5563]">
          시나리오를 선택하면 STM32 실험 CSV를 자동 파싱하고, 같은 화면에서 바로 결과 대시보드를 표시합니다.
        </p>
      </section>

      <section className="rounded-lg border border-[#d1d5db] bg-white p-7 shadow-sm">
        <p className="mb-4 text-2xl font-black tracking-tight text-[#111827]">
          시나리오 선택
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {SCENARIOS.map(({ label, title, desc }) => (
            <button
              key={label}
              type="button"
              onClick={() => setActiveScenario(label)}
              className={`min-h-[7rem] rounded-lg border px-4 py-4 text-left transition ${
                activeScenario === label
                  ? "border-[#111827] bg-[#f3f4f6]"
                  : "border-[#d1d5db] bg-white hover:border-[#111827] hover:bg-[#f9fafb]"
              }`}
            >
              <p className={`text-2xl font-black ${activeScenario === label ? "text-[#111827]" : "text-[#1f2937]"}`}>
                {label}
              </p>
              <p className="mt-1 text-lg font-semibold text-[#4b5563]">{title.replace(`${label} — `, "")}</p>
              <p className="mt-1 text-base font-medium text-[#6b7280]">{desc}</p>
            </button>
          ))}
        </div>

        {activeScenario === "E2" && (
          <div className="mt-6 border-t border-[#e5e7eb] pt-5">
            <p className="mb-3 text-xl font-black text-[#111827]">
              E2 표면 선택
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {E2_SURFACES.map(({ key, label, subDesc }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveE2Surface(key)}
                  className={`min-h-[6rem] rounded-lg border px-5 py-4 text-left transition ${
                    currentSurface === key
                      ? "border-[#111827] bg-[#f3f4f6]"
                      : "border-[#d1d5db] bg-white hover:border-[#111827] hover:bg-[#f9fafb]"
                  }`}
                >
                  <p className="text-xl font-black text-[#111827]">{label}</p>
                  <p className="mt-1 text-sm font-semibold text-[#6b7280]">{subDesc}</p>
                </button>
              ))}
            </div>
            {dashboardReady && (
              <div className="mt-6">
                <E2View showOverview={false} showSurfaceSelector={false} />
              </div>
            )}
          </div>
        )}
      </section>

      {activeFiles && activeScenario !== "E2" && (
        <section className="rounded-lg border border-[#d1d5db] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-black text-[#111827]">
                {activeCfg?.title}
              </p>
              <p className="mt-1 text-base text-[#4b5563]">
                {activeFiles.length}개 CSV · 자동 파싱
              </p>
            </div>
            {loadState.loading && (
              <span className="rounded-full border border-[#d1d5db] bg-[#f3f4f6] px-4 py-2 text-base font-bold text-[#374151]">
                파싱 중...
              </span>
            )}
            {loadState.done && loadState.totalRows != null && (
              <span className="rounded-full border border-[#9ca3af] bg-[#111827] px-4 py-2 text-base font-bold text-white">
                {loadState.totalRows.toLocaleString()}행 · {loadState.durationMs} ms
              </span>
            )}
          </div>
          {loadState.error && (
            <p className="mt-4 rounded-md border border-[#d1d5db] bg-[#f9fafb] px-4 py-3 text-base font-semibold text-[#111827]">
              {loadState.error}
            </p>
          )}
        </section>
      )}

      {activeScenario === "E4" && (
        <section className="rounded-lg border border-[#d1d5db] bg-[#f3f4f6] p-5 shadow-sm">
          <p className="text-xl font-black text-[#111827]">E4 — 정적 장기 안정성</p>
          <p className="mt-2 text-base text-[#4b5563]">
            E4는 논문 확정값 기준 대시보드를 즉시 표시합니다.
          </p>
        </section>
      )}

      {dashboardReady && activeScenario !== "E2" && (
        <section>
          <DashboardView scenario={activeScenario} />
        </section>
      )}
    </div>
  );
}
