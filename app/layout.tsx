import type { Metadata } from "next";
import Link from "next/link";
import { Noto_Sans_KR } from "next/font/google";
import { ActiveNavLink } from "@/components/ActiveNavLink";
import "./globals.css";

// subsets 제거 + preload false: 한국어 폰트는 latin subset이 무의미하고,
// preload 비활성화로 빌드 경고 및 FOUT 위험을 최소화한다.
const notoSansKR = Noto_Sans_KR({
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Edge AI Kalman Dashboard",
  description:
    "STM32 Edge AI adaptive Kalman filter experiments rebuilt as a CSV-based research dashboard.",
};

// additionalPaths: /upload 하위 흐름인 /dashboard도 분석하기 활성 처리
const navItems = [
  { href: "/upload", label: "Analyze", additionalPaths: ["/dashboard"] },
  { href: "/results", label: "Results", additionalPaths: ["/realtime"] },
  { href: "/ablation", label: "Ablation", additionalPaths: [] as string[] },
  { href: "/method", label: "Method", additionalPaths: [] as string[] },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={notoSansKR.variable}>
      <body>
        <div className="min-h-screen bg-[#f7f8fb]">
          <header className="border-b border-[#d9e0ea] bg-white">
            <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-5 md:flex-row md:items-center md:justify-between">
              <Link href="/" className="inline-flex items-center">
                <h1 className="text-xl font-bold tracking-tight text-[#111827]">
                  Edge AI Kalman Dashboard
                </h1>
              </Link>
              <nav aria-label="Main navigation">
                <ul className="flex flex-wrap gap-2">
                  {navItems.map((item) => (
                    <li key={item.href}>
                      <ActiveNavLink
                        href={item.href}
                        label={item.label}
                        additionalPaths={item.additionalPaths}
                      />
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
