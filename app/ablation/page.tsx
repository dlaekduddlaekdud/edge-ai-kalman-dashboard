const featureSets = ["6-feature", "5-feature", "3-feature"];

export default function AblationPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-[#d9e0ea] bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
          Ablation
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-[#111827]">
          Feature set 비교 뷰 예정
        </h2>
        <p className="mt-4 max-w-3xl text-base leading-7 text-[#475569]">
          이 페이지는 6-feature, 5-feature, 3-feature 실험 결과를 비교하는 MVP
          화면으로 구현할 예정입니다. 현재는 실제 데이터 계산 없이 비교 영역만
          표시합니다.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {featureSets.map((featureSet) => (
          <div
            key={featureSet}
            className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-[#111827]">{featureSet}</h3>
            <p className="mt-3 text-sm leading-6 text-[#64748b]">
              Ablation metric placeholder
            </p>
            <p className="mt-4 text-2xl font-semibold text-[#111827]">TBD</p>
          </div>
        ))}
      </section>
    </div>
  );
}
