import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BoltIcon } from "@/components/icons";
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
        {/* Skip link — langsung ke konten utama untuk pengguna keyboard. */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:bg-slate-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
        >
          Lewati ke konten utama
        </a>
        {/* Navbar — sticky agar tetap terlihat saat menggulir */}
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                <BoltIcon className="h-4.5 w-4.5" />
              </span>
              <span className="truncate text-sm font-bold tracking-tight text-slate-900">
                Automation Portal
              </span>
            </div>
            <span className="hidden shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 sm:inline-block">
              Katalog Project Automasi
            </span>
          </div>
        </header>

        <main id="main-content" className="flex-1">
          {children}
        </main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-1.5 px-4 py-5 text-center text-xs text-slate-500 sm:flex-row sm:px-6 sm:text-left">
            <p>Automation Portal — katalog project automasi.</p>
            <p>Next.js • TypeScript • Tailwind CSS</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
