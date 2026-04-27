import type { Metadata } from "next";
import { Fraunces, Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  axes: ["opsz", "SOFT", "WONK"],
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jbMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OLJ Automate — A Career Ledger",
  description:
    "An editorial dossier for your job hunt: track applications, draft letters, and keep score with letterpress clarity.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${manrope.variable} ${jbMono.variable}`}
    >
      <body className="min-h-screen bg-paper text-ink antialiased font-sans">
        <div aria-hidden className="paper-grain" />
        <div className="relative z-[1]">{children}</div>
      </body>
    </html>
  );
}
