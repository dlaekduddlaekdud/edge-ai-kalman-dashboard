type Props = {
  label: string;
  value: string | number;
  unit?: string;
  description?: string;
  color?: string;
  paperBadge?: boolean;
};

export function MetricCard({ label, value, unit, description, color, paperBadge }: Props) {
  return (
    <div
      className="rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm"
      style={color ? { borderLeftWidth: 4, borderLeftColor: color } : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#64748b]">
          {label}
        </p>
        {paperBadge && (
          <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2 py-0.5 text-[11px] font-semibold text-[#1d4ed8]">
            논문 확정값
          </span>
        )}
      </div>
      <p className="mt-2 text-2xl font-bold tabular-nums text-[#111827]" style={color ? { color } : undefined}>
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-[#64748b]">{unit}</span>}
      </p>
      {description && (
        <p className="mt-1 text-xs text-[#94a3b8]">{description}</p>
      )}
    </div>
  );
}
