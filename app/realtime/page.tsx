export default function RealtimePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
          Realtime
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[#111827]">
          실시간 성능 비교
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#475569]">
          MCU 측정 결과와 PC 사후 분석 결과를 sanity check 형태로 비교하는 보조 화면입니다.
          TinyML 추론 시간 CSV 수집 후 활성화됩니다.
        </p>
      </section>

      <section className="rounded-lg border border-[#fde68a] bg-[#fffbeb] p-6 shadow-sm">
        <p className="text-sm font-semibold text-[#92400e]">준비 중</p>
        <p className="mt-2 text-sm text-[#78350f]">
          TinyML-AKF 28컬럼 CSV 수집 후 아래 항목을 표시할 예정입니다.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-[#78350f]">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-[#d97706]">·</span>
            <span>추론 시간 분포 — DWT 카운터 기준 100회 평균 / 최댓값 (목표: &lt;0.5 ms)</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-[#d97706]">·</span>
            <span>200 Hz 제어 루프 충족 여부 — 메인 루프 5 ms 이내</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-[#d97706]">·</span>
            <span>PC 사후 추론 RMSE vs MCU 온라인 추론 RMSE 비교</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
