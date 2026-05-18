export default function RealtimePage() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
          Realtime
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[#111827]">
          MCU 측정 결과 비교 페이지 예정
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#475569]">
          `/realtime`은 확장 기능으로, MCU 측정 결과와 PC 기준 결과를 sanity check
          형태로 비교하는 화면을 계획합니다. 현재는 optional page placeholder입니다.
        </p>
      </section>
    </div>
  );
}
