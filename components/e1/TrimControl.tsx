"use client";

import { type ChangeEvent } from "react";
import { useE1Store } from "@/lib/e1-store";

export default function TrimControl() {
  const { autoExcludeStop, trimTail, setAutoExcludeStop, setTrimTail } = useE1Store();

  function handleTrimTailChange(e: ChangeEvent<HTMLInputElement>) {
    const val = parseInt(e.target.value, 10);
    setTrimTail(isNaN(val) ? 0 : val);
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={autoExcludeStop}
          onChange={(e) => setAutoExcludeStop(e.target.checked)}
          className="h-4 w-4 rounded border-[#d9e0ea] accent-[#111827]"
        />
        <span className="text-sm text-[#475569]">정지구간 자동 제외</span>
      </label>
      <label className="flex items-center gap-2">
        <span className="text-sm text-[#475569]">뒷부분</span>
        <input
          type="number"
          min={0}
          value={trimTail}
          onChange={handleTrimTailChange}
          className="w-16 rounded-md border border-[#d9e0ea] px-2 py-1 text-sm text-[#111827] focus:border-[#111827] focus:outline-none"
        />
        <span className="text-sm text-[#475569]">행 제외</span>
      </label>
    </div>
  );
}
