"use client";

import { useEffect, useId, useRef, useState } from "react";
import { COMMENT_EMOJI_GROUPS } from "@/lib/comment-emojis";

type CommentEmojiPickerProps = {
  onInsert: (emoji: string) => void;
  disabled?: boolean;
};

export const CommentEmojiPicker = ({ onInsert, disabled }: CommentEmojiPickerProps) => {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el || !(e.target instanceof Node) || el.contains(e.target)) return;
      setOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const handlePick = (emoji: string) => {
    onInsert(emoji);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
        className="soft-pill px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition-opacity hover:bg-white/60 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span aria-hidden className="text-base leading-none">
          😊
        </span>
        <span>表情</span>
      </button>

      {open ? (
        <div
          id={panelId}
          role="dialog"
          aria-label="选择表情"
          className="surface-card absolute left-0 top-[calc(100%+6px)] z-50 w-[min(100vw-2rem,18rem)] max-h-[min(40vh,16rem)] overflow-hidden rounded-[1.25rem] shadow-lg"
        >
          <div
            className={
              "max-h-[min(40vh,16rem)] overflow-y-auto overscroll-y-contain p-3 " +
              "[scrollbar-width:thin] [scrollbar-color:rgba(24,98,84,0.28)_transparent] " +
              "[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent " +
              "[&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[rgba(24,98,84,0.22)] " +
              "hover:[&::-webkit-scrollbar-thumb]:bg-[rgba(24,98,84,0.38)]"
            }
          >
            <div className="flex flex-col gap-4 pr-0.5">
              {COMMENT_EMOJI_GROUPS.map((group) => (
                <div key={group.id}>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted-strong)]">
                    {group.label}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {group.emojis.map((emoji) => (
                      <button
                        key={`${group.id}-${emoji}`}
                        type="button"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-lg leading-none transition-colors hover:bg-[var(--accent-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => handlePick(emoji)}
                        aria-label={`插入 ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
