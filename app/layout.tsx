import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Edge AI Kalman Dashboard",
  description:
    "STM32 Edge AI adaptive Kalman filter experiments rebuilt as a CSV-based research dashboard.",
};

const navItems = [
  { href: "/", label: "Overview" },
  { href: "/upload", label: "Data" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/ablation", label: "Ablation" },
  { href: "/results", label: "Results" },
  { href: "/method", label: "Method" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen bg-[#f7f8fb]">
          <header className="border-b border-[#d9e0ea] bg-white">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
              <Link href="/" className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#2563eb]">
                  졸업연구
                </p>
                <h1 className="text-xl font-semibold text-[#111827]">
                  Edge AI Kalman Dashboard
                </h1>
              </Link>
              <nav aria-label="Main navigation">
                <ul className="flex flex-wrap gap-2">
                  {navItems.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="inline-flex rounded-md border border-[#d9e0ea] bg-white px-3 py-2 text-sm font-medium text-[#334155] transition hover:border-[#2563eb] hover:text-[#1d4ed8]"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
