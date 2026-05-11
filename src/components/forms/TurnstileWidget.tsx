"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        options: {
          sitekey: string;
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      remove?: (id?: string) => void;
      reset: (id?: string) => void;
    };
  }
}

interface TurnstileWidgetProps {
  siteKey?: string;
  onTokenChange: (token: string) => void;
}

export const TurnstileWidget = ({ siteKey, onTokenChange }: TurnstileWidgetProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<string | null>(null);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const [scriptReady, setScriptReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.turnstile),
  );

  useEffect(() => {
    queueMicrotask(() => setWidgetError(null));
  }, [siteKey]);

  /**
   * When the Turnstile script is served from cache, `next/script` `onLoad` may not fire.
   * Poll briefly so `scriptReady` still flips after `window.turnstile` appears.
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.turnstile) {
      queueMicrotask(() => setScriptReady(true));
      return;
    }
    const started = Date.now();
    const maxMs = 12_000;
    const id = window.setInterval(() => {
      if (window.turnstile) {
        setScriptReady(true);
        window.clearInterval(id);
      } else if (Date.now() - started > maxMs) {
        window.clearInterval(id);
      }
    }, 50);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (!siteKey || !scriptReady || !window.turnstile || !ref.current || widgetId.current) {
      return;
    }
    widgetId.current = window.turnstile.render(ref.current, {
      sitekey: siteKey,
      callback: (token) => {
        setWidgetError(null);
        onTokenChange(token);
      },
      "expired-callback": () => onTokenChange(""),
      "error-callback": () => {
        setWidgetError(
          "人机验证加载失败（错误 400020 表示 Site Key 无效）。请在 Cloudflare Turnstile 控制台创建站点，把真实 Site Key 写入部署环境变量 NEXT_PUBLIC_TURNSTILE_SITE_KEY，并确认主机名列表包含当前域名。",
        );
        onTokenChange("");
      },
    });
    return () => {
      if (widgetId.current && window.turnstile?.remove) {
        window.turnstile.remove(widgetId.current);
      }
      widgetId.current = null;
      onTokenChange("");
    };
  }, [onTokenChange, scriptReady, siteKey]);

  if (!siteKey) {
    return (
      <p className="text-xs text-[var(--danger)]">
        未配置有效的 Turnstile Site Key（请勿保留 wrangler 模板里的 replace-with… 占位符）。部署前请在 Cloudflare 控制台创建 Turnstile 站点并配置{" "}
        <code className="rounded bg-black/5 px-1 py-0.5 text-[0.85em]">NEXT_PUBLIC_TURNSTILE_SITE_KEY</code>。
      </p>
    );
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      {widgetError ? <p className="text-xs text-[var(--danger)]">{widgetError}</p> : null}
      <div ref={ref} />
    </>
  );
};
