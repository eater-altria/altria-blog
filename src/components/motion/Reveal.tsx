"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** Stagger index -- each unit adds 80 ms of transition-delay. */
  delay?: number;
  as?: "div" | "section" | "header" | "aside" | "footer" | "li" | "article";
  style?: CSSProperties;
};

export function Reveal({ children, className, delay = 0, as: Tag = "div", style }: Props) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("revealed");
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          observer.unobserve(el);
        }
      },
      { threshold: 0.12 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const mergedStyle: CSSProperties | undefined =
    delay > 0 ? { ...style, transitionDelay: `${delay * 80}ms` } : style;

  return (
    <Tag
      ref={ref as React.RefObject<never>}
      className={`reveal-on-scroll ${className ?? ""}`}
      style={mergedStyle}
    >
      {children}
    </Tag>
  );
}
