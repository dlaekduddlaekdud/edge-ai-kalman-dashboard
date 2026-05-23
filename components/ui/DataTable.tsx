import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function DataTable({ children, className = "" }: Props) {
  return (
    <div className={`overflow-x-auto rounded-lg border border-[#d9e0ea] ${className}`}>
      <table className="w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  );
}

export function DataThead({ children }: { children: ReactNode }) {
  return (
    <thead className="bg-[#f8fafc]">
      {children}
    </thead>
  );
}

export function DataTbody({ children }: { children: ReactNode }) {
  return (
    <tbody className="divide-y divide-[#e2e8f0]">
      {children}
    </tbody>
  );
}
