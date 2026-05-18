const scenarios = ["E0", "E1", "E2", "E3", "E4", "E5"];
const algorithms = ["Fixed KF", "CM-AKF", "TinyML-AKF"];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
          Dashboard
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[#111827]">
          시나리오별 분석 대시보드 예정
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#475569]">
          `/dashboard`는 E0~E5 시나리오 선택, 알고리즘 토글, run 선택, 메트릭
          카드와 차트 자동 분기를 담당할 예정입니다. 현재는 실제 차트와 지표 계산
          없이 레이아웃만 배치했습니다.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-4 rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">
              Scenario Selector
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {scenarios.map((scenario) => (
                <span
                  key={scenario}
                  className="rounded-md border border-[#d9e0ea] px-3 py-2 text-center text-sm font-medium text-[#334155]"
                >
                  {scenario}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#111827]">
              Algorithm Toggle
            </h3>
            <div className="mt-3 space-y-2">
              {algorithms.map((algorithm) => (
                <div
                  key={algorithm}
                  className="rounded-md border border-[#d9e0ea] px-3 py-2 text-sm text-[#334155]"
                >
                  {algorithm}
                </div>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            {["RMSE", "MAE", "NIS pass rate", "Max Error"].map((metric) => (
              <div
                key={metric}
                className="rounded-lg border border-[#d9e0ea] bg-white p-4 shadow-sm"
              >
                <p className="text-sm text-[#64748b]">{metric}</p>
                <p className="mt-2 text-xl font-semibold text-[#111827]">TBD</p>
              </div>
            ))}
          </div>
          <div className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#111827]">Chart Area</h3>
            <div className="mt-4 flex min-h-72 items-center justify-center rounded-lg border border-dashed border-[#94a3b8] bg-[#f8fafc]">
              <p className="text-sm font-medium text-[#64748b]">
                Recharts scenario view placeholder
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
