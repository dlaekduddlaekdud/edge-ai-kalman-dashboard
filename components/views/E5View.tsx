"use client";

import Link from "next/link";
import { useE1Store } from "@/lib/e1-store";
import { PAPER_RESULTS } from "@/lib/paper-results";
import { ALGO_COLORS, algorithmStyles, semanticColors } from "@/lib/palette";
import RunSelector from "@/components/e1/RunSelector";
import AlgorithmToggle from "@/components/e1/AlgorithmToggle";
import TrimControl from "@/components/e1/TrimControl";
import E1MetricCards from "@/components/e1/E1MetricCards";
import PositionChart from "@/components/e1/charts/PositionChart";
import CMRChart from "@/components/e1/charts/CMRChart";
import ResidualChart from "@/components/e1/charts/ResidualChart";

const E5 = PAPER_RESULTS.E5;

export default function E5View() {
  const { runs } = useE1Store();
  const hasAnyRun = Object.values(runs).some((r) => r !== undefined);

  const cmImprovement = (((E5.raw.rmse - E5.cm.rmse) / E5.raw.rmse) * 100).toFixed(1);
  const tinymlVsCm = (E5.tinyml.rmse - E5.cm.rmse).toFixed(2);

  return (
    <div className="space-y-6">
      {/* 개요 카드 */}
      <div className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#111827]">
          E5 — 미지 표면 일반화
        </p>
        <p className="mt-1 text-sm text-[#475569]">{E5.description}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <span className="rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1 text-[#64748b]">
            {E5.runs}run · {E5.totalFrames}frame
          </span>
          <span className="rounded-full border border-[#d1d5db] bg-[#f3f4f6] px-3 py-1 text-[#4b5563]">
            E2 훈련 데이터에 없는 표면
          </span>
          {hasAnyRun ? (
            <span className="rounded-full border border-[#d1d5db] bg-[#f3f4f6] px-3 py-1 text-[#111827]">
              ✓ CSV 분석 활성화
            </span>
          ) : (
            <span className="rounded-full border border-[#d1d5db] bg-[#f3f4f6] px-3 py-1 text-[#111827]">
              논문 확정값 표시
            </span>
          )}
        </div>
      </div>

      {/* ── CSV 동적 분석 (데이터 있을 때) ── */}
      {hasAnyRun ? (
        <>
          {/* 컨트롤 패널 */}
          <div className="rounded-lg border border-[#d1d5db] bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xl font-black text-[#111827]">
                  업로드 CSV 분석
                </p>
                <span className="rounded-full border border-[#111827] bg-[#111827] px-3 py-1 text-sm font-bold text-white">
                  동적 분석
                </span>
              </div>
              <div>
                <p className="mb-2 text-lg font-black text-[#111827]">런 선택</p>
                <RunSelector />
              </div>
              <div>
                <p className="mb-2 text-lg font-black text-[#111827]">알고리즘</p>
                <AlgorithmToggle />
              </div>
              <div>
                <p className="mb-2 text-lg font-black text-[#111827]">트림 설정</p>
                <TrimControl />
              </div>
            </div>
          </div>

          {/* 메트릭 카드 (E5 논문값) */}
          <E1MetricCards />

          {/* 위치 추정 차트 */}
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
            <PositionChart />
          </div>

          {/* 잔차 + CM-R 차트 */}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
              <ResidualChart />
            </div>
            <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
              <CMRChart />
            </div>
          </div>
        </>
      ) : (
        /* CSV 미로드 시 — 데이터 탭 안내 */
        <div className="rounded-lg border border-[#d1d5db] bg-[#f3f4f6] p-6 shadow-sm">
          <p className="text-base font-semibold text-[#4b5563]">E5 CSV가 로드되지 않았습니다.</p>
          <p className="mt-2 text-sm text-[#374151]">
            Data 탭에서 E5를 선택하고 데이터를 불러오면 위치 추정 차트와 잔차 분석을 볼 수 있습니다.
          </p>
          <Link
            href="/upload"
            className="mt-4 inline-block rounded-md bg-[#111827] px-4 py-2 text-sm font-semibold text-white hover:bg-[#111827]"
          >
            Data 탭에서 E5 불러오기 →
          </Link>
        </div>
      )}

      {/* ── 논문 확정값 RMSE 카드 (항상 표시) ── */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div
          className="rounded-lg border p-5 shadow-sm"
          style={{ borderColor: algorithmStyles.raw.border, backgroundColor: algorithmStyles.raw.bg }}
        >
          <p className="text-xs font-semibold" style={{ color: algorithmStyles.raw.text }}>Raw ToF</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: algorithmStyles.raw.text }}>{E5.raw.rmse} mm</p>
          <p className="mt-0.5 text-xs text-[#94a3b8]">MAE {E5.raw.mae} mm</p>
        </div>
        <div
          className="rounded-lg border p-5 shadow-sm"
          style={{ borderColor: algorithmStyles.fixed.border, backgroundColor: algorithmStyles.fixed.bg }}
        >
          <p className="text-xs font-semibold" style={{ color: algorithmStyles.fixed.text }}>Fixed KF</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: algorithmStyles.fixed.text }}>{E5.fixed.rmse} mm</p>
          <p className="mt-0.5 text-xs text-[#4b5563]">
            MAE {E5.fixed.mae} mm · NIS {E5.fixed.nis != null ? `${(E5.fixed.nis * 100).toFixed(1)}%` : "—"}
          </p>
        </div>
        <div
          className="rounded-lg border p-5 shadow-sm"
          style={{ borderColor: algorithmStyles.cmAkf.border, backgroundColor: algorithmStyles.cmAkf.bg }}
        >
          <p className="text-xs font-semibold" style={{ color: algorithmStyles.cmAkf.text }}>CM-AKF</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: algorithmStyles.cmAkf.text }}>{E5.cm.rmse} mm</p>
          <p className="mt-0.5 text-xs text-[#4b5563]">MAE {E5.cm.mae} mm · {cmImprovement}% 개선</p>
        </div>
        <div
          className="rounded-lg border p-5 shadow-sm"
          style={{ borderColor: algorithmStyles.tinymlAkf.border, backgroundColor: algorithmStyles.tinymlAkf.bg }}
        >
          <p className="text-xs font-semibold" style={{ color: algorithmStyles.tinymlAkf.text }}>TinyML-AKF</p>
          <p className="mt-2 text-2xl font-bold" style={{ color: algorithmStyles.tinymlAkf.text }}>{E5.tinyml.rmse} mm</p>
          <p className="mt-0.5 text-xs text-[#4b5563]">MAE {E5.tinyml.mae} mm · CM+{tinymlVsCm}mm</p>
        </div>
      </div>

      {/* 알고리즘 순위 */}
      <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-[#111827]">성능 순위 (RMSE 기준)</h3>
        <div className="mt-3 space-y-2">
          {[
            { rank: 1, id: "cm" as const,     label: "CM-AKF",     rmse: E5.cm.rmse,     note: "미지 표면 최적 적응" },
            { rank: 2, id: "tinyml" as const, label: "TinyML-AKF", rmse: E5.tinyml.rmse, note: `CM보다 +${tinymlVsCm}mm (일반화 한계)` },
            { rank: 3, id: "fixed" as const,  label: "Fixed KF",   rmse: E5.fixed.rmse,  note: "고정 R — 표면 변화 미적응" },
            { rank: 4, id: "raw" as const,    label: "Raw ToF",    rmse: E5.raw.rmse,    note: "필터 없음" },
          ].map(({ rank, id, label, rmse, note }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-5 text-center text-xs font-bold text-[#94a3b8]">{rank}</span>
              <div className="flex flex-1 items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: ALGO_COLORS[id] }} />
                <span className="text-sm font-medium text-[#111827]">{label}</span>
              </div>
              <span className="font-mono text-sm font-semibold text-[#111827]">{rmse} mm</span>
              <span className="text-xs text-[#94a3b8]">{note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Anomaly 강조 */}
      <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-5 shadow-sm">
        <p className="text-xs font-semibold" style={{ color: semanticColors.danger }}>⚠ Run 5 — 비정상 R̂ 피크</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div>
            <p className="text-xs text-[#94a3b8]">cm_R_max (Run 5)</p>
            <p className="text-2xl font-bold" style={{ color: semanticColors.danger }}>{E5.run5CmRMax} mm²</p>
          </div>
          <div className="flex-1 text-sm text-[#374151]">
            Run 5에서 cm_R이 {E5.run5CmRMax}mm²로 폭발적 상승.
            회색 우드락 특유의 반사 특성이 CM-AKF R̂ 추정에 급격한 변화를 유발한 것으로 추정.
            TinyML은 이 피크를 학습 데이터에서 본 적 없어 추적 어려움.
          </div>
        </div>
      </div>

      {/* Signal Rate + 일반화 해석 */}
      <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
        <h3 className="text-base font-semibold text-[#111827]">미지 표면 반사 특성</h3>
        <div className="mt-3 divide-y divide-[#f1f5f9]">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[#475569]">회색 우드락 Signal Rate</span>
            <span className="text-sm font-semibold text-[#111827]">{E5.graySignalRate} MCps</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[#475569]">흰 우드락 Signal Rate (비교)</span>
            <span className="text-sm font-semibold text-[#94a3b8]">~15.5 MCps</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-[#475569]">차이</span>
            <span className="text-sm font-semibold text-[#4b5563]">≈ 0.52 MCps 낮음</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-[#64748b]">
          회색 표면은 흰 표면과 유사하나 signal_rate가 약간 낮음.
          TinyML 6-feature 모델의 일부 적응 한계 확인.
        </p>
      </div>

      <div className="rounded-md border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-xs text-[#64748b]">
        <p className="font-semibold" style={{ color: semanticColors.warning }}>한계 및 해석 주의사항</p>
        <p className="mt-1">{E5.note}</p>
        <p className="mt-1">
          TinyML이 CM-AKF보다 0.53mm 높은 RMSE를 보이는 것은 6-feature 모델이
          E2(흰/검정/아크릴) 훈련 데이터 분포에 최적화되어 있기 때문입니다.
          미지 표면에서의 일반화 성능 향상을 위해서는 추가 표면 데이터 수집이 필요합니다.
        </p>
      </div>
    </div>
  );
}
