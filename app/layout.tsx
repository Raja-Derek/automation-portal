import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import AuthProvider from "@/components/AuthProvider";
import TopBar from "@/components/TopBar";
import SiteFooter from "@/components/SiteFooter";
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
    "Katalog project otomasi PT Lintas Cakrawiapta — hasil pengujian terbuka untuk umum, dikelola admin.",
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

        <AuthProvider>
          <TopBar />

          <main id="main-content" className="flex-1">
            {children}
          </main>

          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
