import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";
import { Reveal } from "@/components/motion/Reveal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: "Altria Journal",
    template: "%s | Altria Journal",
  },
  description: "关于工程、AI、创作和生活观察的个人博客。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full text-[var(--foreground)]">
        <Nav />
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col px-4 sm:px-6">
          <main className="flex-1 py-10 sm:py-12">{children}</main>
          <Reveal as="footer" className="border-t border-[var(--line-soft)] py-6 text-sm text-[var(--muted)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>Altria Journal</p>
              <div className="flex flex-wrap items-center gap-4">
                <a href="/rss.xml" className="story-link">
                  RSS
                </a>
                <a href="/sitemap.xml" className="story-link">
                  Sitemap
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </body>
    </html>
  );
}
