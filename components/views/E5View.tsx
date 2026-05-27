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
        <p className="text-xl font-bold text-[#111827]">
          E5 — 미지 표면 일반화
        </p>
        <p className="mt-2 text-base text-[#475569]">{E5.description}</p>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
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
          <p className="text-base font-bold" style={{ color: algorithmStyles.raw.text }}>Raw ToF</p>
          <p className="mt-2 text-3xl font-black" style={{ color: algorithmStyles.raw.text }}>{E5.raw.rmse} mm</p>
          <p className="mt-1 text-sm text-[#94a3b8]">MAE {E5.raw.mae} mm</p>
        </div>
        <div
          className="rounded-lg border p-5 shadow-sm"
          style={{ borderColor: algorithmStyles.fixed.border, backgroundColor: algorithmStyles.fixed.bg }}
        >
          <p className="text-base font-bold" style={{ color: algorithmStyles.fixed.text }}>Fixed KF</p>
          <p className="mt-2 text-3xl font-black" style={{ color: algorithmStyles.fixed.text }}>{E5.fixed.rmse} mm</p>
          <p className="mt-1 text-sm text-[#4b5563]">
            MAE {E5.fixed.mae} mm · NIS {E5.fixed.nis != null ? `${(E5.fixed.nis * 100).toFixed(1)}%` : "—"}
          </p>
        </div>
        <div
          className="rounded-lg border p-5 shadow-sm"
          style={{ borderColor: algorithmStyles.cmAkf.border, backgroundColor: algorithmStyles.cmAkf.bg }}
        >
          <p className="text-base font-bold" style={{ color: algorithmStyles.cmAkf.text }}>CM-AKF</p>
          <p className="mt-2 text-3xl font-black" style={{ color: algorithmStyles.cmAkf.text }}>{E5.cm.rmse} mm</p>
          <p className="mt-1 text-sm text-[#4b5563]">MAE {E5.cm.mae} mm · {cmImprovement}% 개선</p>
        </div>
        <div
          className="rounded-lg border p-5 shadow-sm"
          style={{ borderColor: algorithmStyles.tinymlAkf.border, backgroundColor: algorithmStyles.tinymlAkf.bg }}
        >
          <p className="text-base font-bold" style={{ color: algorithmStyles.tinymlAkf.text }}>TinyML-AKF</p>
          <p className="mt-2 text-3xl font-black" style={{ color: algorithmStyles.tinymlAkf.text }}>{E5.tinyml.rmse} mm</p>
          <p className="mt-1 text-sm text-[#4b5563]">MAE {E5.tinyml.mae} mm · CM+{tinymlVsCm}mm</p>
        </div>
      </div>

      {/* 알고리즘 순위 */}
      <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
        <h3 className="text-xl font-bold text-[#111827]">성능 순위 (RMSE 기준)</h3>
        <div className="mt-4 space-y-3">
          {[
            { rank: 1, id: "cm" as const,     label: "CM-AKF",     rmse: E5.cm.rmse,     note: "미지 표면 적응" },
            { rank: 2, id: "tinyml" as const, label: "TinyML-AKF", rmse: E5.tinyml.rmse, note: `CM보다 +${tinymlVsCm}mm, 거의 동등` },
            { rank: 3, id: "fixed" as const,  label: "Fixed KF",   rmse: E5.fixed.rmse,  note: "고정 R — 표면 변화 미적응" },
            { rank: 4, id: "raw" as const,    label: "Raw ToF",    rmse: E5.raw.rmse,    note: "필터 없음" },
          ].map(({ rank, id, label, rmse, note }) => (
            <div key={label} className="flex items-center gap-3">
              <span className="w-6 text-center text-base font-bold text-[#94a3b8]">{rank}</span>
              <div className="flex flex-1 items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: ALGO_COLORS[id] }} />
                <span className="text-base font-semibold text-[#111827]">{label}</span>
              </div>
              <span className="font-mono text-base font-bold text-[#111827]">{rmse} mm</span>
              <span className="text-sm text-[#94a3b8]">{note}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Anomaly 강조 */}
      <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] p-5 shadow-sm">
        <p className="text-base font-bold" style={{ color: semanticColors.danger }}>⚠ Run 5 — 비정상 R̂ 피크</p>
        <div className="mt-3 flex flex-wrap items-center gap-4">
          <div>
            <p className="text-sm text-[#94a3b8]">cm_R_max (Run 5)</p>
            <p className="text-3xl font-black" style={{ color: semanticColors.danger }}>{E5.run5CmRMax} mm²</p>
          </div>
          <div className="flex-1 text-base text-[#374151]">
            Run 5에서 cm_R이 {E5.run5CmRMax}mm²로 상승했으나 위치 추정은 정상 범위에 머물렀습니다.
            회색 단면 우드락의 반사 특성은 학습 표면과 다르지만,
            TinyML-AKF는 R clamp 한계에 도달하지 않고 발산 없이 동작했습니다.
          </div>
        </div>
      </div>

      {/* Signal Rate + 일반화 해석 */}
      <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
        <h3 className="text-xl font-bold text-[#111827]">미지 표면 반사 특성</h3>
        <div className="mt-3 divide-y divide-[#f1f5f9]">
          <div className="flex items-center justify-between py-3">
            <span className="text-base text-[#475569]">회색 우드락 Signal Rate</span>
            <span className="text-base font-semibold text-[#111827]">{E5.graySignalRate} Mcps</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-base text-[#475569]">흰 우드락 Signal Rate (비교)</span>
            <span className="text-base font-semibold text-[#94a3b8]">~15.5 Mcps</span>
          </div>
          <div className="flex items-center justify-between py-3">
            <span className="text-base text-[#475569]">차이</span>
            <span className="text-base font-semibold text-[#4b5563]">유사한 범위</span>
          </div>
        </div>
        <p className="mt-3 text-sm text-[#64748b]">
          회색 단면 우드락의 signal_rate는 가시광 밝기와 단순 단조 관계로 설명되지 않습니다.
          ToF 신호 강도는 940 nm IR 반사·투과 특성, 표면 광택성, 평탄도에 영향을 받습니다.
        </p>
      </div>

      <div className="rounded-md border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-sm text-[#64748b]">
        <p className="text-base font-semibold" style={{ color: semanticColors.warning }}>한계 및 해석 주의사항</p>
        <p className="mt-1">{E5.note}</p>
        <p className="mt-1">
          CM-AKF {E5.cm.rmse}mm, TinyML-AKF {E5.tinyml.rmse}mm로 두 적응형 알고리즘은 거의 동등했습니다.
          실용 환경 일반화 보장을 위해서는 향후 더 다양한 표면 데이터 수집이 필요합니다.
        </p>
      </div>
    </div>
  );
}
