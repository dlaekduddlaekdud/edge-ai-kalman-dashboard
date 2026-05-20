export default function MethodPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
          Method
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[#111827]">
          논문 4.3절 평가 지표
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#475569]">
          실험 CSV를 분석하는 데 사용된 평가 지표 정의와 TypeScript 구현 위치를 정리합니다.
        </p>
      </section>

      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-[#111827]">Spec → Implementation</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
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
                  def: "√(1/N · Σ(x̂ − x_gt)²)",
                  impl: "lib/metrics.ts · calculateRMSE()",
                },
                {
                  name: "MAE",
                  def: "1/N · Σ|x̂ − x_gt|",
                  impl: "lib/metrics.ts · calculateMAE()",
                },
                {
                  name: "NIS 95% pass rate",
                  def: "ν²/S ∈ [0.00098, 5.024] 비율 (χ² df=1 양측 95%)",
                  impl: "lib/metrics.ts · calculateNISPassRate()",
                },
                {
                  name: "R 추정 RMSE",
                  def: "√(1/N · Σ(R̂ − R_label)²)",
                  impl: "lib/metrics.ts · calculateRRMSE() / 별도 노트북",
                },
                {
                  name: "수렴시간 Tconv",
                  def: "직전 1초 슬라이딩 RMSE ≤ 1.1 × RMSE_ss 최초 진입 시각",
                  impl: "lib/metrics.ts · calculateTconv() / 별도 노트북",
                },
                {
                  name: "TinyML 추론 시간",
                  def: "DWT 카운터 100회 평균/최댓값 (목표 < 0.5 ms)",
                  impl: "tinyml_infer_us 컬럼 — Realtime 페이지 예정",
                },
              ].map(({ name, def, impl }) => (
                <tr key={name}>
                  <td className="px-4 py-3 font-medium text-[#111827]">{name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#475569]">{def}</td>
                  <td className="px-4 py-3 text-[#64748b]">{impl}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-[#111827]">GT 복원 방식 및 한계</h3>
        <div className="mt-4 rounded-md bg-[#f8fafc] p-4 font-mono text-xs text-[#475569]">
          <p>stop_mask  = rows where encoder_distance_mm == 0</p>
          <p>base       = mean(tof_distance_mm[stop_mask])</p>
          <p>gt[k]      = base − encoder_distance_mm[k]</p>
        </div>
        <p className="mt-3 text-sm text-[#64748b]">
          base를 ToF 센서값에서 추출하므로 ToF 정적 bias가 RMSE에 반영됩니다.
          알고리즘 간 상대 비교에는 유효하나, 절대 정확도 비교는 외부 기준(줄자/레이저)이 필요합니다.
        </p>
      </section>
    </div>
  );
}
