import { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
};

export function Panel({ children, className = "" }: Props) {
  return (
    <div className={`rounded-lg border border-[#d9e0ea] bg-white p-5 shadow-sm ${className}`}>
      {children}
    </div>
  );
}
