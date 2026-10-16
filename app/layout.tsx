import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Automation Portal",
  description:
    "Kelola link project automasi dengan hak akses admin & pengguna — login, guard server, validasi ganda.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        {/* Navbar sederhana */}
        <div className="border-b border-slate-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-sm font-bold text-white">
                A
              </div>
              <span className="text-sm font-bold tracking-tight">
                Automation Portal
              </span>
            </div>
            <span className="hidden text-xs text-slate-400 sm:block">
              Next.js + Tailwind • Siap deploy ke Vercel
            </span>
          </div>
        </div>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-4 text-center text-xs text-slate-400 sm:px-6">
            Dibuat dengan Next.js App Router + TypeScript + Tailwind CSS •
            Auth JWT cookie HttpOnly • Guard admin di server
          </div>
        </footer>
      </body>
    </html>
  );
}
