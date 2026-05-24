import { ALGO_COLORS, algorithmStyles, semanticColors } from "@/lib/palette";

function metricColor(name: string): string {
  if (name.includes("TinyML")) return ALGO_COLORS.tinyml;
  if (name.includes("NIS") || name === "R 평균" || name.includes("R Drift")) return ALGO_COLORS.cm;
  if (name.includes("Tconv") || name.includes("추론")) return ALGO_COLORS.fixed;
  return ALGO_COLORS.raw;
}

export default function MethodPage() {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p
          className="text-base font-bold uppercase tracking-[0.14em]"
          style={{ color: semanticColors.brand }}
        >
          Method / Metrics
        </p>
        <h2 className="mt-3 text-3xl font-black text-[#111827]">평가지표</h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#475569]">
          실험 CSV를 분석하는 데 사용된 평가 지표 정의와 TypeScript 구현 위치를 정리합니다.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-4">
            <p className="text-base font-bold" style={{ color: semanticColors.brand }}>CSV Parse</p>
            <p className="mt-1 text-sm font-semibold text-[#475569]">25/28컬럼 schema</p>
          </div>
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-4">
            <p className="text-base font-bold" style={{ color: algorithmStyles.cmAkf.text }}>Metrics</p>
            <p className="mt-1 text-sm font-semibold text-[#475569]">RMSE · NIS · Tconv</p>
          </div>
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-4">
            <p className="text-base font-bold" style={{ color: algorithmStyles.tinymlAkf.text }}>TinyML</p>
            <p className="mt-1 text-sm font-semibold text-[#475569]">R̂ label tracking</p>
          </div>
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-4">
            <p className="text-base font-bold" style={{ color: semanticColors.warning }}>Limit</p>
            <p className="mt-1 text-sm font-semibold text-[#475569]">GT bias 주의</p>
          </div>
        </div>
      </section>

      {/* Spec to Implementation */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold" style={{ color: semanticColors.brand }}>
          Spec to Implementation
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-base">
            <thead className="bg-[#f8fafc]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#475569]">지표</th>
                <th className="px-4 py-3 text-left font-semibold text-[#475569]">정의</th>
                <th className="px-4 py-3 text-left font-semibold text-[#475569]">구현 위치</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {[
                {
                  name: "RMSE",
                  def: "sqrt(1/N * sum((x_hat - x_gt)^2))",
                  impl: "lib/metrics.ts · calculateRMSE()",
                },
                {
                  name: "MAE",
                  def: "1/N * sum(|x_hat - x_gt|)",
                  impl: "lib/metrics.ts · calculateMAE()",
                },
                {
                  name: "NIS 95% pass rate",
                  def: "v^2/S in [0.00098, 5.024] 비율 (chi-sq df=1 양측 95%)",
                  impl: "lib/metrics.ts · calculateNISPassRate()",
                },
                {
                  name: "RMSEss",
                  def: "후반 50 frame(1초 @ 50Hz) 기준 RMSE",
                  impl: "lib/metrics.ts · calculateRMSEss()",
                },
                {
                  name: "수렴시간 Tconv",
                  def: "직전 1초(50 frame) 슬라이딩 RMSE <= 1.1 * RMSE_ss 최초 진입 시각",
                  impl: "lib/metrics.ts · calculateTconv()",
                },
                {
                  name: "E0 수렴시간 Tconv",
                  def: "|x_hat - x_gt| <= epsilon(기본 5mm) 최초 진입 시각",
                  impl: "lib/metrics.ts · calculateTconvE0()",
                },
                {
                  name: "R 평균",
                  def: "mean(cm_R) — 표면별 단조성 분석",
                  impl: "lib/metrics.ts · calculateRMean()",
                },
                {
                  name: "R Drift CV",
                  def: "std(R) / mean(R) * 100 — 장기 안정성 E4",
                  impl: "lib/metrics.ts · calculateRDriftCV()",
                },
                {
                  name: "TinyML R 라벨 추적도",
                  def: "MAE(tinyml_R, cm_R)",
                  impl: "lib/metrics.ts · calculateLabelTracking()",
                },
                {
                  name: "TinyML 추론 시간",
                  def: "DWT 카운터 기준 평균/최댓값 (목표 < 0.5 ms)",
                  impl: "tinyml_infer_us 컬럼 — /realtime 페이지",
                },
              ].map(({ name, def, impl }) => (
                <tr key={name}>
                  <td className="px-4 py-3 font-semibold" style={{ color: metricColor(name) }}>
                    {name}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#475569]">{def}</td>
                  <td className="px-4 py-3 text-xs text-[#64748b]">{impl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* GT 복원 방식 및 한계 */}
      <section className="rounded-lg border border-[#fde68a] bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold" style={{ color: semanticColors.warning }}>
          GT 복원 방식 및 한계
        </h3>
        <div className="mt-4 rounded-md border border-[#fde68a] bg-[#fffbeb] p-4 font-mono text-sm text-[#78350f]">
          <p>stop_mask  = rows where encoder_distance_mm == 0</p>
          <p>base       = mean(tof_distance_mm[stop_mask])</p>
          <p>gt[k]      = base - encoder_distance_mm[k]</p>
        </div>
        <p className="mt-3 text-base text-[#78350f]">
          base를 ToF 센서값에서 추출하므로 ToF 정적 bias가 RMSE에 반영됩니다.
          알고리즘 간 상대 비교에는 유효하나, 절대 정확도 비교는 외부 기준(줄자/레이저)이 필요합니다.
        </p>
      </section>

      {/* CSV 스키마 */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold" style={{ color: ALGO_COLORS.tinyml }}>
          CSV 스키마
        </h3>
        <div className="mt-4 space-y-3 text-base text-[#475569]">
          <div className="rounded-md border border-[#d9e0ea] bg-white p-4">
            <p className="font-bold" style={{ color: semanticColors.brand }}>
              25컬럼 (Fixed KF + CM-AKF)
            </p>
            <p className="mt-1 text-sm text-[#475569]">공통 12 + Fixed KF 6 + CM-AKF 7</p>
          </div>
          <div className="rounded-md border border-[#d9e0ea] bg-white p-4">
            <p className="font-bold" style={{ color: algorithmStyles.tinymlAkf.text }}>
              28컬럼 (+ TinyML-AKF)
            </p>
            <p className="mt-1 text-sm text-[#475569]">
              25컬럼 + tinyml_estimate_mm + tinyml_R + tinyml_infer_us
            </p>
          </div>
          <p className="text-sm text-[#94a3b8]">
            TinyML 3컬럼이 모두 있을 때만 TinyML 분석 활성화. NIS는 Fixed/CM만 계산 (TinyML은 innovation_cov 없음).
          </p>
        </div>
      </section>

      {/* 필터 파라미터 */}
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <h3 className="text-xl font-bold" style={{ color: ALGO_COLORS.cm }}>
          필터 파라미터 및 구현 세부사항
        </h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-base">
            <thead className="bg-[#f8fafc]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-[#475569]">항목</th>
                <th className="px-4 py-3 text-left font-semibold text-[#475569]">값 / 방식</th>
                <th className="px-4 py-3 text-left font-semibold text-[#475569]">비고</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {[
                {
                  item: "NIS Bounds",
                  value: "[0.00098, 5.024]",
                  note: "chi-square(df=1) 양측 95%",
                },
                {
                  item: "Sliding Window W",
                  value: "W = 20",
                  note: "초기 100ms(50Hz) warm-up 제외. 분산 추정 안정성 vs 환경 반응 trade-off.",
                },
                {
                  item: "Tconv Criterion",
                  value: "슬라이딩 RMSE ≤ 1.1 × RMSEss",
                  note: "직전 50 frame(1초) 윈도우 기준 최초 충족 시각(ms)",
                },
                {
                  item: "Numerical Stability",
                  value: "log1p / expm1",
                  note: "R 추정값 폭발 방지. cm_R이 이상 커지는 경우 대비.",
                },
                {
                  item: "INT8 Quantization",
                  value: "TFLite INT8",
                  note: "STM32F446RE MCU 온보드. f32 대비 최대 −23.6% MAE_R (6f 기준).",
                },
                {
                  item: "MCU Clock",
                  value: "180 MHz",
                  note: "DWT 사이클 카운터 기반 추론 시간 측정.",
                },
              ].map(({ item, value, note }) => (
                <tr key={item}>
                  <td className="px-4 py-3 font-medium text-[#111827]">{item}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#111827]">{value}</td>
                  <td className="px-4 py-3 text-xs text-[#64748b]">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
