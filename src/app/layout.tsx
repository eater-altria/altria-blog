import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  colorScheme: "light dark",
};

// Runs synchronously before any styled content paints. Resolves the stored
// preference (defaulting to "system") to a concrete data-theme on <html>, so
// we never flash the light palette to dark-mode users.
const themeInitScript = `(function(){try{var p=localStorage.getItem('theme')||'system';var d=p==='dark'||(p==='system'&&matchMedia('(prefers-color-scheme: dark)').matches);var r=document.documentElement;r.dataset.theme=d?'dark':'light';r.dataset.themePref=p;}catch(e){}})();`;

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
      suppressHydrationWarning
    >
      <body className="min-h-full text-[var(--foreground)]">
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
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
