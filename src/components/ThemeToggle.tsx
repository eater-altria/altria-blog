"use client";

import { useEffect, useSyncExternalStore } from "react";

type Pref = "light" | "dark" | "system";

const STORAGE_KEY = "theme";
const CYCLE: Pref[] = ["system", "light", "dark"];

/** In-process pub/sub so the click handler re-renders subscribers without round-tripping through storage events (those don't fire for same-window writes). */
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  const onCrossTabStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) cb();
  };
  window.addEventListener("storage", onCrossTabStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onCrossTabStorage);
  };
};

const getSnapshot = (): Pref => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system";
  } catch {
    return "system";
  }
};

/** SSR renders with the safe default; the inline script in layout.tsx has already
    set the correct data-theme on <html>, so the icon catching up on hydration is purely cosmetic. */
const getServerSnapshot = (): Pref => "system";

const resolveSystem = (): "light" | "dark" =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

const applyTheme = (pref: Pref) => {
  const root = document.documentElement;
  root.dataset.theme = pref === "system" ? resolveSystem() : pref;
  root.dataset.themePref = pref;
};

const labelFor = (pref: Pref) =>
  pref === "light" ? "亮色" : pref === "dark" ? "暗色" : "跟随系统";

export const ThemeToggle = () => {
  const pref = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (pref !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [pref]);

  const handleClick = () => {
    const next = CYCLE[(CYCLE.indexOf(pref) + 1) % CYCLE.length];
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {}
    applyTheme(next);
    notify();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={`切换主题，当前：${labelFor(pref)}`}
      title={`主题：${labelFor(pref)}（点击切换）`}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--surface-border)] bg-[var(--surface-raised)] text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-raised-strong)] hover:text-[var(--foreground)]"
    >
      {pref === "light" ? <SunIcon /> : pref === "dark" ? <MoonIcon /> : <SystemIcon />}
    </button>
  );
};

const iconProps = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const SunIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);

const MoonIcon = () => (
  <svg {...iconProps}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
  </svg>
);

const SystemIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="4" width="18" height="13" rx="2" />
    <path d="M8 21h8M12 17v4" />
  </svg>
);
