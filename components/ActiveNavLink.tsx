"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = { href: string; label: string; additionalPaths?: string[] };

export function ActiveNavLink({ href, label, additionalPaths = [] }: Props) {
  const pathname = usePathname();
  // additionalPaths: 연관 서브 경로에서도 해당 nav 항목을 활성 상태로 표시
  const isActive =
    pathname === href ||
    (href !== "/" && pathname.startsWith(href + "/")) ||
    additionalPaths.some(
      (p) => pathname === p || pathname.startsWith(p + "/"),
    );
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={`inline-flex rounded-md border px-4 py-2.5 text-base font-semibold transition
        ${
          isActive
            ? "border-[#111827] bg-[#111827] !text-white"
            : "border-[#d1d5db] bg-white text-[#111827] hover:border-[#111827] hover:bg-[#f3f4f6]"
        }`}
      style={isActive ? { color: "#ffffff" } : undefined}
    >
      {label}
    </Link>
  );
}
