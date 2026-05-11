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
  const [scriptReady, setScriptReady] = useState(
    () => typeof window !== "undefined" && Boolean(window.turnstile),
  );

  useEffect(() => {
    if (!siteKey || !scriptReady || !window.turnstile || !ref.current || widgetId.current) {
      return;
    }
    widgetId.current = window.turnstile.render(ref.current, {
      sitekey: siteKey,
      callback: (token) => onTokenChange(token),
      "expired-callback": () => onTokenChange(""),
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
    return <p className="cyber-danger text-xs">未配置 Turnstile Site Key，暂时无法提交。</p>;
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div ref={ref} />
    </>
  );
};
