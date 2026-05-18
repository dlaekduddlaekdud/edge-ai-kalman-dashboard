"use client";

import { ChangeEvent, useMemo, useState } from "react";
import {
  NULLABLE_COLUMNS,
  parseKFCSV,
  REQUIRED_COLUMNS,
  type KFColumn,
  type KFRow,
  type ScenarioId,
} from "@/lib/csv-parser";

const NULLABLE_COLUMN_SET: ReadonlySet<string> = new Set(NULLABLE_COLUMNS);

const KEY_COLUMNS = [
  "timestamp_ms",
  "tof_distance_mm",
  "encoder_distance_mm",
  "kf_estimate_mm",
  "gt_distance_mm",
  "tof_residual",
  "R_label",
  "kalman_gain",
  "innovation_cov",
  "scenario_id",
] as const satisfies readonly KFColumn[];

type PreviewMode = "key" | "all";

function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown CSV parsing error.";
}

function formatCellValue(value: KFRow[KFColumn]): string {
  return value === null ? "NULL" : String(value);
}

function getScenarioSortValue(scenarioId: ScenarioId): number {
  if (typeof scenarioId === "number") {
    return scenarioId;
  }

  return Number(scenarioId.slice(1));
}

function PreviewCell({ value }: { value: KFRow[KFColumn] }) {
  if (value === null) {
    return (
      <span className="inline-flex rounded-md bg-[#fef3c7] px-2 py-1 text-xs font-semibold text-[#92400e]">
        NULL
      </span>
    );
  }

  return <span>{formatCellValue(value)}</span>;
}

export default function UploadPage() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<KFRow[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("key");

  const scenarioIds = useMemo(() => {
    return Array.from(new Set(rows.map((row) => row.scenario_id))).sort(
      (left, right) => getScenarioSortValue(left) - getScenarioSortValue(right),
    );
  }, [rows]);

  const previewRows = rows.slice(0, 5);
  const previewColumns = previewMode === "key" ? KEY_COLUMNS : REQUIRED_COLUMNS;
  const previewModeDescription =
    previewMode === "key"
      ? "Showing key columns only. Switch to All columns to inspect the full CSV schema."
      : "Showing all 18 columns from the README Data Format schema.";

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    setRows([]);
    setErrorMessage(null);

    if (!file) {
      setFileName(null);
      return;
    }

    setFileName(file.name);
    setIsParsing(true);

    try {
      const csvText = await file.text();
      const parsedRows = parseKFCSV(csvText);
      setRows(parsedRows);
    } catch (error) {
      setErrorMessage(formatErrorMessage(error));
    } finally {
      setIsParsing(false);
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
          Upload
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[#111827]">
          CSV 업로드 및 18컬럼 검증
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#475569]">
          실험 CSV를 업로드하면 README Data Format 기준의 18개 컬럼을 검증하고,
          첫 5개 row를 미리보기로 확인합니다. 업로드 데이터는 아직 dashboard로
          전달하지 않고 이 페이지 내부 상태로만 관리합니다.
        </p>
      </section>

      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <h3 className="text-lg font-semibold text-[#111827]">
              실험 CSV 선택
            </h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#64748b]">
              헤더 row에는 README에 정의된 18개 컬럼이 모두 있어야 합니다.
              nullable 컬럼의 빈 문자열은 `null`로 처리됩니다. `scenario_id`는
              숫자 또는 `E0` 같은 시나리오 label을 허용하고, 그 외 잘못된 숫자
              문자열은 에러로 표시됩니다.
            </p>
            <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[#94a3b8] bg-[#f8fafc] px-6 py-10 text-center transition hover:border-[#2563eb] hover:bg-[#eff6ff]">
              <span className="text-sm font-semibold text-[#1d4ed8]">
                CSV 파일 선택
              </span>
              <span className="mt-2 text-sm text-[#64748b]">
                `.csv` 또는 `text/csv` 파일을 업로드하세요.
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          </div>

          <aside className="rounded-lg border border-[#d9e0ea] bg-[#f8fafc] p-5">
            <h3 className="text-sm font-semibold text-[#111827]">
              Nullable Columns
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {NULLABLE_COLUMNS.map((column) => (
                <span
                  key={column}
                  className="rounded-md border border-[#d9e0ea] bg-white px-2 py-1 text-xs font-medium text-[#475569]"
                >
                  {column}
                </span>
              ))}
            </div>
            <p className="mt-4 text-sm leading-6 text-[#64748b]">
              미리보기 테이블에서 빈 nullable 값은 노란색 `NULL` 배지로 표시됩니다.
            </p>
          </aside>
        </div>
      </section>

      {isParsing ? (
        <section className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-[#64748b]">
            CSV를 읽고 18컬럼을 검증하는 중입니다.
          </p>
        </section>
      ) : null}

      {errorMessage ? (
        <section className="rounded-lg border border-[#fecaca] bg-[#fff7f7] p-5 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#dc2626]">
            Parse Failed
          </p>
          <h3 className="mt-2 text-lg font-semibold text-[#991b1b]">
            CSV 검증에 실패했습니다.
          </h3>
          <p className="mt-3 rounded-md bg-white px-4 py-3 font-mono text-sm text-[#7f1d1d]">
            {errorMessage}
          </p>
        </section>
      ) : null}

      {rows.length > 0 ? (
        <section className="space-y-5 rounded-lg border border-[#bbf7d0] bg-white p-6 shadow-sm">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#16a34a]">
              Parse Success
            </p>
            <h3 className="mt-2 text-xl font-semibold text-[#111827]">
              CSV 검증 완료
            </h3>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-[#d9e0ea] bg-[#f8fafc] p-4">
              <p className="text-sm text-[#64748b]">File name</p>
              <p className="mt-2 break-all text-base font-semibold text-[#111827]">
                {fileName}
              </p>
            </div>
            <div className="rounded-lg border border-[#d9e0ea] bg-[#f8fafc] p-4">
              <p className="text-sm text-[#64748b]">Total rows</p>
              <p className="mt-2 text-2xl font-semibold text-[#111827]">
                {rows.length}
              </p>
            </div>
            <div className="rounded-lg border border-[#d9e0ea] bg-[#f8fafc] p-4">
              <p className="text-sm text-[#64748b]">Scenario IDs</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {scenarioIds.map((scenarioId) => (
                  <span
                    key={String(scenarioId)}
                    className="rounded-md bg-[#dbeafe] px-2 py-1 text-sm font-semibold text-[#1d4ed8]"
                  >
                    {scenarioId}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#111827]">
                  Preview: first 5 rows
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#64748b]">
                  {previewModeDescription}
                </p>
              </div>
              <div
                aria-label="Preview column mode"
                className="inline-flex w-full rounded-lg border border-[#d9e0ea] bg-[#f8fafc] p-1 md:w-auto"
              >
                <button
                  type="button"
                  onClick={() => setPreviewMode("key")}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition md:flex-none ${
                    previewMode === "key"
                      ? "bg-white text-[#1d4ed8] shadow-sm"
                      : "text-[#64748b] hover:text-[#334155]"
                  }`}
                  aria-pressed={previewMode === "key"}
                >
                  Key columns
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode("all")}
                  className={`flex-1 rounded-md px-4 py-2 text-sm font-semibold transition md:flex-none ${
                    previewMode === "all"
                      ? "bg-white text-[#1d4ed8] shadow-sm"
                      : "text-[#64748b] hover:text-[#334155]"
                  }`}
                  aria-pressed={previewMode === "all"}
                >
                  All columns
                </button>
              </div>
            </div>
            <div className="mt-3 overflow-x-auto rounded-lg border border-[#d9e0ea]">
              <table className="min-w-max border-collapse bg-white text-left text-sm">
                <thead className="bg-[#f1f5f9] text-[#334155]">
                  <tr>
                    {previewColumns.map((column) => (
                      <th
                        key={column}
                        scope="col"
                        className="border-b border-r border-[#d9e0ea] px-3 py-3 font-semibold last:border-r-0"
                      >
                        <div className="flex items-center gap-2 whitespace-nowrap">
                          <span>{column}</span>
                          {NULLABLE_COLUMN_SET.has(column) ? (
                            <span className="rounded bg-[#fef3c7] px-1.5 py-0.5 text-[10px] font-semibold text-[#92400e]">
                              nullable
                            </span>
                          ) : null}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row, rowIndex) => (
                    <tr key={`${row.timestamp_ms}-${rowIndex}`}>
                      {previewColumns.map((column) => (
                        <td
                          key={column}
                          className="border-b border-r border-[#e2e8f0] px-3 py-3 text-[#334155] last:border-r-0"
                        >
                          <PreviewCell value={row[column]} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
