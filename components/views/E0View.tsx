import { PAPER_RESULTS } from "@/lib/paper-results";

const E0 = PAPER_RESULTS.E0;

function MetricCard({
  title,
  value,
  unit,
  note,
}: {
  title: string;
  value: string;
  unit?: string;
  note?: string;
}) {
  return (
    <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">{title}</p>
      <p className="mt-2 text-2xl font-bold text-[#111827]">
        {value}
        {unit && <span className="ml-1 text-base font-normal text-[#64748b]">{unit}</span>}
      </p>
      {note && <p className="mt-1 text-xs text-[#94a3b8]">{note}</p>}
    </div>
  );
}

export default function E0View() {
  return (
    <div className="space-y-6">
      {/* 개요 카드 */}
      <div className="rounded-lg border border-[#d1d5db] bg-[#f3f4f6] p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#111827]">
              E0 — Python 합성 시뮬레이션
            </p>
            <p className="mt-1 text-sm text-[#374151]">
              2,000 step, σ_process=0.5mm, σ_meas=5mm, Fixed KF 단독 검증
            </p>
          </div>
          <span className="rounded-full border border-[#d1d5db] bg-white px-3 py-1 text-xs text-[#111827]">
            CSV 업로드 없음
          </span>
        </div>

        {/* RMSE 개선 화살표 */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="rounded-md bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-[#64748b]">Raw RMSE</p>
            <p className="text-xl font-bold text-[#111827]">{E0.rawRMSE} mm</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl text-[#111827]">→</span>
            <div className="rounded-full bg-[#dcfce7] px-3 py-1 text-sm font-semibold text-[#111827]">
              {E0.improvement}% 개선
            </div>
            <span className="text-2xl text-[#111827]">→</span>
          </div>
          <div className="rounded-md bg-white px-4 py-3 shadow-sm">
            <p className="text-xs text-[#64748b]">KF RMSE</p>
            <p className="text-xl font-bold text-[#111827]">{E0.kfRMSE} mm</p>
          </div>
        </div>
      </div>

      {/* 메트릭 카드 2×2 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="P_ss (공분산 수렴)"
          value={E0.pSS.toFixed(2)}
          unit="mm²"
          note="Riccati 해석해와 일치"
        />
        <MetricCard
          title="K_ss (칼만 이득)"
          value={E0.kSS.toFixed(3)}
          note="정상 상태 칼만 이득"
        />
        <MetricCard
          title="NIS 95% Pass Rate"
          value={`${(E0.nisPassRate * 100).toFixed(1)}%`}
          note="chi-square(df=1) 양측 95%"
        />
        <MetricCard
          title="Tconv"
          value={`${E0.tconv.toFixed(3)}s`}
          note={`${E0.tconvSteps} step, ε=5mm 절대 임계`}
        />
      </div>

      {/* NIS 구간 배너 */}
      <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold text-[#64748b]">NIS 기각역 (chi-square df=1, 95%)</p>
        <div className="mt-3 flex items-center gap-4">
          <div className="flex-1 rounded-md bg-[#f8fafc] p-3 text-center">
            <p className="text-xs text-[#94a3b8]">하한</p>
            <p className="mt-1 font-mono text-base font-semibold text-[#111827]">
              {E0.nisInterval[0]}
            </p>
          </div>
          <div className="rounded-full bg-[#f3f4f6] px-4 py-1.5 text-sm font-semibold text-[#111827]">
            통과 구간
          </div>
          <div className="flex-1 rounded-md bg-[#f8fafc] p-3 text-center">
            <p className="text-xs text-[#94a3b8]">상한</p>
            <p className="mt-1 font-mono text-base font-semibold text-[#111827]">
              {E0.nisInterval[1]}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-[#94a3b8]">
          NIS = ν² / S. ν: 혁신량, S: 혁신 공분산. 위 구간에 포함되면 필터 일관성 확인됨.
        </p>
      </div>

      {/* 슬라이딩 윈도우 파라미터 */}
      <div className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold text-[#64748b]">슬라이딩 윈도우 W={E0.slidingWindow}</p>
        <p className="mt-2 text-sm text-[#475569]">{E0.slidingWindowNote}</p>
        <div className="mt-3 flex gap-3">
          <div className="rounded-md bg-[#f3f4f6] px-3 py-2 text-center">
            <p className="text-xs text-[#6b7280]">W=20 (채택)</p>
            <p className="mt-0.5 text-xs font-semibold text-[#111827]">분산 추정 안정</p>
          </div>
          <div className="rounded-md bg-[#f3f4f6] px-3 py-2 text-center">
            <p className="text-xs text-[#4b5563]">W=30 (비교)</p>
            <p className="mt-0.5 text-xs font-semibold text-[#4b5563]">환경 반응 느림</p>
          </div>
        </div>
      </div>

      {/* 한계 주석 */}
      <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-4 py-3 text-xs text-[#64748b]">
        ⚠️ E0는 Python 합성 시뮬레이션입니다. 실제 ToF 센서 없음.
        결과는 고정 KF 파라미터(Q, R)의 이론적 성능 상한을 확인하는 데 사용됩니다.
        per-frame 시계열 데이터가 없어 시각화는 확정 수치 카드로 대체합니다.
      </div>
    </div>
  );
}
