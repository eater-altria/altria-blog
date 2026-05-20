"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Status = "idle" | "loading" | "playing" | "paused";
type Mode = "cloud" | "browser";

const RATE_OPTIONS = [0.8, 1, 1.2, 1.5, 1.8] as const;

const HIGHLIGHT_CLASS = "article-reader-highlight";

type Props = {
  /** Post slug — used to call the `/api/tts/[slug]` cloud endpoint. */
  slug: string;
};

/** ------------------------------------------------------------------------
 * Browser SpeechSynthesis fallback path. Pulled out so the cloud path can
 * delegate cleanly when /api/tts is unavailable.
 * --------------------------------------------------------------------- */

function collectReadableBlocks(root: HTMLElement): Array<{ el: HTMLElement; sentences: string[] }> {
  const blocks = Array.from(
    root.querySelectorAll<HTMLElement>("p, h1, h2, h3, h4, h5, h6, li, blockquote"),
  );
  const out: Array<{ el: HTMLElement; sentences: string[] }> = [];
  for (const el of blocks) {
    if (el.closest("pre, code, .mermaid-container")) continue;
    const raw = (el.innerText ?? el.textContent ?? "").trim();
    if (!raw) continue;
    const sentences = raw
      .split(/(?<=[。！？；…!?;])\s*|\n+/u)
      .map((s) => s.trim())
      .filter(Boolean);
    if (sentences.length === 0) continue;
    out.push({ el, sentences });
  }
  return out;
}

function pickVoice(lang: string): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return undefined;
  const prefix = lang.toLowerCase().split("-")[0];
  return (
    voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase() && v.localService) ??
    voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase()) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(prefix))
  );
}

function clearHighlights() {
  document
    .querySelectorAll<HTMLElement>(`.${HIGHLIGHT_CLASS}`)
    .forEach((el) => el.classList.remove(HIGHLIGHT_CLASS));
}

function isBrowserSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

function fmtSeconds(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/** ------------------------------------------------------------------------ */

const PlayIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <path d="M4 2.5v11l9-5.5z" fill="currentColor" />
  </svg>
);
const PauseIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <rect x="4" y="3" width="3" height="10" rx="0.5" fill="currentColor" />
    <rect x="9" y="3" width="3" height="10" rx="0.5" fill="currentColor" />
  </svg>
);
const StopIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <rect x="3.5" y="3.5" width="9" height="9" rx="1" fill="currentColor" />
  </svg>
);
const SpinnerIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" className="animate-spin">
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.6" fill="none" opacity="0.25" />
    <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
  </svg>
);

export function ArticleReader({ slug }: Props) {
  const [status, setStatus] = useState<Status>("idle");
  const [mode, setMode] = useState<Mode>("cloud");
  const [rate, setRate] = useState(1);
  const [browserSupported] = useState(isBrowserSpeechSupported);
  const [rateMenuOpen, setRateMenuOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  /** Cloud mode: HTMLAudioElement progress (in seconds). */
  const [audioTime, setAudioTime] = useState({ current: 0, duration: 0 });
  /** Browser mode: paragraph index / total. */
  const [browserProgress, setBrowserProgress] = useState({ index: 0, total: 0 });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  /** Lets us detach all <audio> listeners atomically before manual cleanup, so that
   *  `audio.src = ""` (which fires an `error` event) doesn't accidentally trigger the
   *  failure-fallback path when the user is just stopping playback. */
  const audioAbortRef = useRef<AbortController | null>(null);

  const blocksRef = useRef<Array<{ el: HTMLElement; sentences: string[] }>>([]);
  const blockIdxRef = useRef(0);
  const sentenceIdxRef = useRef(0);
  const rateRef = useRef(rate);
  const cancelGuardRef = useRef(false);
  const speakNextRef = useRef<() => void>(() => {});

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  // Reflect rate change on the <audio> element instantly.
  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = rate;
  }, [rate]);

  /** Tear everything down on unmount. */
  useEffect(() => {
    return () => {
      cancelGuardRef.current = true;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      audioAbortRef.current?.abort();
      audioAbortRef.current = null;
      const a = audioRef.current;
      if (a) {
        a.pause();
        a.removeAttribute("src");
        a.load();
        audioRef.current = null;
      }
      clearHighlights();
    };
  }, []);

  /** --------- Browser fallback playback ----------------------------- */

  const highlightBlock = useCallback((idx: number) => {
    clearHighlights();
    const block = blocksRef.current[idx];
    if (!block) return;
    block.el.classList.add(HIGHLIGHT_CLASS);
    const rect = block.el.getBoundingClientRect();
    if (rect.top < 80 || rect.bottom > window.innerHeight - 80) {
      block.el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  const speakNext = useCallback(() => {
    if (cancelGuardRef.current) return;
    const blocks = blocksRef.current;
    let bi = blockIdxRef.current;
    let si = sentenceIdxRef.current;

    while (bi < blocks.length && si >= blocks[bi].sentences.length) {
      bi += 1;
      si = 0;
    }
    if (bi >= blocks.length) {
      blockIdxRef.current = 0;
      sentenceIdxRef.current = 0;
      setBrowserProgress((p) => ({ ...p, index: 0 }));
      setStatus("idle");
      clearHighlights();
      return;
    }

    if (si === 0) {
      highlightBlock(bi);
      setBrowserProgress((p) => ({ ...p, index: bi }));
    }
    blockIdxRef.current = bi;
    sentenceIdxRef.current = si;

    const utterance = new SpeechSynthesisUtterance(blocks[bi].sentences[si]);
    utterance.lang = "zh-CN";
    utterance.rate = rateRef.current;
    const voice = pickVoice("zh-CN");
    if (voice) utterance.voice = voice;

    utterance.onend = () => {
      if (cancelGuardRef.current) return;
      sentenceIdxRef.current += 1;
      speakNextRef.current();
    };
    utterance.onerror = (e) => {
      if (e.error === "canceled" || e.error === "interrupted") return;
      cancelGuardRef.current = true;
      window.speechSynthesis.cancel();
      setStatus("idle");
      clearHighlights();
    };

    window.speechSynthesis.speak(utterance);
  }, [highlightBlock]);

  useEffect(() => {
    speakNextRef.current = speakNext;
  }, [speakNext]);

  const startBrowserPlayback = useCallback(() => {
    if (!browserSupported) {
      setErrorMsg("当前浏览器不支持朗读");
      return;
    }
    const root = document.querySelector<HTMLElement>("[data-article-prose]");
    if (!root) return;
    const blocks = collectReadableBlocks(root);
    if (blocks.length === 0) return;

    cancelGuardRef.current = true;
    window.speechSynthesis.cancel();
    setTimeout(() => {
      cancelGuardRef.current = false;
      blocksRef.current = blocks;
      blockIdxRef.current = 0;
      sentenceIdxRef.current = 0;
      setBrowserProgress({ index: 0, total: blocks.length });
      setStatus("playing");
      speakNextRef.current();
    }, 30);
  }, [browserSupported]);

  /** --------- Cloud playback --------------------------------------- */

  const releaseAudio = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    // Detach listeners FIRST so the synthetic `error` event from clearing src is ignored.
    audioAbortRef.current?.abort();
    audioAbortRef.current = null;
    audioRef.current = null;
    a.pause();
    a.removeAttribute("src");
    a.load();
  }, []);

  /** Probe /api/tts on error to learn whether it's disabled / rate-limited / failed,
   *  then fall back to browser SpeechSynthesis. The probe is a second request but it's
   *  only fired on the error path (rare), so the duplicate cost is acceptable. */
  const handleAudioFailure = useCallback(
    async (defaultMsg: string) => {
      try {
        const probe = await fetch(`/api/tts/${encodeURIComponent(slug)}`, {
          method: "GET",
          credentials: "same-origin",
        });
        let reason = "";
        let msg = "";
        try {
          const j = (await probe.json()) as { reason?: string; error?: string };
          reason = j.reason ?? "";
          msg = j.error ?? "";
        } catch {
          /* not JSON, ignore */
        }
        if (probe.status === 503 && reason === "tts-disabled") {
          setMode("browser");
          startBrowserPlayback();
          return;
        }
        if (probe.status === 429) {
          setErrorMsg(msg || "请求过于频繁，已切换到本地朗读");
        } else if (!probe.ok) {
          setErrorMsg(msg || `云端朗读失败 (${probe.status})，已切换本地朗读`);
        } else {
          setErrorMsg(defaultMsg);
        }
      } catch {
        setErrorMsg(defaultMsg);
      }
      setMode("browser");
      startBrowserPlayback();
    },
    [slug, startBrowserPlayback],
  );

  const startCloudPlayback = useCallback(() => {
    setStatus("loading");
    setErrorMsg(null);
    releaseAudio();

    // Direct streaming: browser fetches and plays as bytes arrive. Skips the blob() wait,
    // so playback starts at first-byte (server flushes as soon as Doubao returns chunk 1).
    const audio = new Audio();
    audio.playbackRate = rateRef.current;
    audio.preload = "auto";
    audio.crossOrigin = "use-credentials";
    const ac = new AbortController();
    const opts = { signal: ac.signal };
    audio.addEventListener(
      "canplay",
      () => setStatus("playing"),
      opts,
    );
    audio.addEventListener(
      "timeupdate",
      () => setAudioTime({ current: audio.currentTime, duration: audio.duration || 0 }),
      opts,
    );
    audio.addEventListener(
      "loadedmetadata",
      () => setAudioTime({ current: 0, duration: audio.duration || 0 }),
      opts,
    );
    audio.addEventListener(
      "ended",
      () => {
        setStatus("idle");
        setAudioTime({ current: 0, duration: audio.duration || 0 });
      },
      opts,
    );
    audio.addEventListener(
      "error",
      () => {
        releaseAudio();
        void handleAudioFailure("音频播放失败，已切换本地朗读");
      },
      opts,
    );
    audioRef.current = audio;
    audioAbortRef.current = ac;
    audio.src = `/api/tts/${encodeURIComponent(slug)}`;
    audio.play().catch(() => {
      // play() may reject before `error` fires (e.g. autoplay block). Let the error handler
      // handle the diagnostics; nothing extra needed here.
    });
  }, [slug, releaseAudio, handleAudioFailure]);

  /** --------- Unified control handlers ----------------------------- */

  const handlePlay = useCallback(() => {
    if (status === "paused") {
      if (mode === "cloud" && audioRef.current) {
        audioRef.current.play().then(() => setStatus("playing")).catch(() => {});
        return;
      }
      if (mode === "browser" && browserSupported) {
        window.speechSynthesis.resume();
        setStatus("playing");
        return;
      }
    }
    if (status === "playing") return;

    // Fresh start: prefer cloud, fall back to browser if cloud isn't available.
    if (mode === "cloud") {
      startCloudPlayback();
    } else {
      startBrowserPlayback();
    }
  }, [status, mode, browserSupported, startCloudPlayback, startBrowserPlayback]);

  const handlePause = useCallback(() => {
    if (status !== "playing") return;
    if (mode === "cloud" && audioRef.current) {
      audioRef.current.pause();
      setStatus("paused");
      return;
    }
    if (mode === "browser" && browserSupported) {
      window.speechSynthesis.pause();
      setStatus("paused");
    }
  }, [status, mode, browserSupported]);

  const handleStop = useCallback(() => {
    cancelGuardRef.current = true;
    if (mode === "cloud") {
      releaseAudio();
      setAudioTime({ current: 0, duration: 0 });
    }
    if (browserSupported) window.speechSynthesis.cancel();
    blockIdxRef.current = 0;
    sentenceIdxRef.current = 0;
    setBrowserProgress((p) => ({ ...p, index: 0 }));
    setStatus("idle");
    clearHighlights();
  }, [mode, browserSupported, releaseAudio]);

  const handleRateChange = useCallback(
    (next: number) => {
      setRate(next);
      rateRef.current = next;
      setRateMenuOpen(false);
      if (mode === "cloud" && audioRef.current) {
        audioRef.current.playbackRate = next;
        return;
      }
      if (mode === "browser" && (status === "playing" || status === "paused")) {
        cancelGuardRef.current = true;
        window.speechSynthesis.cancel();
        setTimeout(() => {
          cancelGuardRef.current = false;
          setStatus("playing");
          speakNextRef.current();
        }, 30);
      }
    },
    [mode, status],
  );

  /** --------- Render ----------------------------------------------- */

  const active = status !== "idle";
  let progressLabel: string | null = null;
  if (active) {
    if (mode === "cloud") {
      progressLabel = `${fmtSeconds(audioTime.current)} / ${fmtSeconds(audioTime.duration)}`;
    } else if (browserProgress.total > 0) {
      progressLabel = `${Math.min(browserProgress.index + 1, browserProgress.total)} / ${browserProgress.total}`;
    }
  }

  if (!browserSupported && mode === "browser") {
    // No cloud config + no browser support → nothing to do.
    return null;
  }

  const playingNow = status === "playing";
  const loadingNow = status === "loading";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!active && !loadingNow ? (
        <button
          type="button"
          onClick={handlePlay}
          className="button-secondary inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium tracking-wide"
          aria-label="朗读全文"
        >
          <PlayIcon />
          <span>朗读全文</span>
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={playingNow ? handlePause : handlePlay}
            disabled={loadingNow}
            className="button-secondary inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium tracking-wide disabled:opacity-60"
            aria-label={loadingNow ? "正在加载" : playingNow ? "暂停朗读" : "继续朗读"}
          >
            {loadingNow ? <SpinnerIcon /> : playingNow ? <PauseIcon /> : <PlayIcon />}
            <span>{loadingNow ? "加载中" : playingNow ? "暂停" : "继续"}</span>
          </button>
          <button
            type="button"
            onClick={handleStop}
            className="button-secondary inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium tracking-wide"
            aria-label="停止朗读"
          >
            <StopIcon />
            <span>停止</span>
          </button>
        </>
      )}

      <div className="relative">
        <button
          type="button"
          onClick={() => setRateMenuOpen((v) => !v)}
          className="button-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium tracking-wide tabular-nums"
          aria-haspopup="listbox"
          aria-expanded={rateMenuOpen}
          aria-label={`朗读语速 ${rate}x`}
        >
          <span>{rate}x</span>
          <svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true">
            <path
              d="M2 4l3 3 3-3"
              stroke="currentColor"
              strokeWidth="1.4"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {rateMenuOpen && (
          <>
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              className="fixed inset-0 z-30 cursor-default"
              onClick={() => setRateMenuOpen(false)}
            />
            <ul
              role="listbox"
              aria-label="朗读语速"
              className="surface-card absolute right-0 z-40 mt-1 min-w-[5rem] overflow-hidden p-1 text-xs"
            >
              {RATE_OPTIONS.map((opt) => (
                <li key={opt}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={opt === rate}
                    onClick={() => handleRateChange(opt)}
                    className={`block w-full rounded-lg px-2.5 py-1.5 text-left tabular-nums transition-colors ${
                      opt === rate
                        ? "bg-[var(--accent-soft)] text-[var(--accent)]"
                        : "text-[var(--muted)] hover:bg-[var(--surface-raised-strong)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {opt}x
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      {progressLabel && (
        <span className="soft-pill px-2.5 py-1 text-[11px] tabular-nums">{progressLabel}</span>
      )}
      {active && (
        <span className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted-strong)]">
          {mode === "cloud" ? "云端" : "本地"}
        </span>
      )}
      {errorMsg && (
        <span className="text-[11px] text-[var(--muted)]" role="status">
          {errorMsg}
        </span>
      )}
    </div>
  );
}
