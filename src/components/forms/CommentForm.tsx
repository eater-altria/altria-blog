"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { CommentEmojiPicker } from "@/components/forms/CommentEmojiPicker";
import { TurnstileWidget } from "@/components/forms/TurnstileWidget";

export type CommentReplyTarget = { id: string; username: string };

interface CommentFormProps {
  slug: string;
  siteKey?: string;
  /** 服务端根据 HttpOnly Cookie 判定：30 分钟内已验证过则可跳过 Turnstile UI。 */
  skipCommentTurnstile?: boolean;
  replyTo?: CommentReplyTarget | null;
  onCancelReply?: () => void;
  onPosted?: () => void;
}

export const CommentForm = ({
  slug,
  siteKey,
  skipCommentTurnstile = false,
  replyTo,
  onCancelReply,
  onPosted,
}: CommentFormProps) => {
  const router = useRouter();
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const [body, setBody] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const insertEmoji = useCallback((emoji: string) => {
    const el = bodyRef.current;
    if (!el) {
      setBody((prev) => prev + emoji);
      return;
    }
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    setBody((prev) => prev.slice(0, start) + emoji + prev.slice(end));
    const pos = start + emoji.length;
    queueMicrotask(() => {
      const ta = bodyRef.current;
      if (!ta) return;
      ta.focus();
      ta.setSelectionRange(pos, pos);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${slug}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body,
          ...(skipCommentTurnstile ? {} : { turnstileToken }),
          ...(replyTo?.id ? { parentCommentId: replyTo.id } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "评论发布失败");
        setBusy(false);
        return;
      }
      setBody("");
      setTurnstileToken("");
      onPosted?.();
      router.refresh();
      setBusy(false);
    } catch {
      setError("请求失败，请稍后重试");
      setBusy(false);
    }
  };

  const replyBanner = replyTo ? (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line-strong)] bg-[var(--accent-soft)] px-3 py-2 text-xs text-[var(--foreground)]">
        <span>
          正在回复{" "}
          <strong className="text-[var(--accent)]">@{replyTo.username.trim() || "用户"}</strong>
        </span>
        {onCancelReply ? (
          <button
            type="button"
            className="rounded-full border border-transparent px-2 py-0.5 font-medium text-[var(--muted)] underline-offset-2 hover:text-[var(--foreground)] hover:underline"
            onClick={onCancelReply}
          >
            取消
          </button>
        ) : null}
      </div>
    ) : null;

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      {replyBanner}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CommentEmojiPicker onInsert={insertEmoji} disabled={busy} />
          <span className="text-xs text-[var(--muted)]">在光标处插入</span>
        </div>
        <textarea
          ref={bodyRef}
          className="input-shell min-h-[120px] p-4 text-sm leading-7"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={5000}
          placeholder={replyTo ? `回复 @${replyTo.username}…` : "写下你的评论..."}
        />
      </div>
      {skipCommentTurnstile ? (
        <p className="text-xs text-[var(--muted)]">
          本设备 30 分钟内已通过人机验证，可直接发表评论。
        </p>
      ) : (
        <TurnstileWidget siteKey={siteKey} onTokenChange={setTurnstileToken} />
      )}
      {error && (
        <p className="text-xs text-[var(--danger)]">{error}</p>
      )}
      <button
        disabled={busy || (!skipCommentTurnstile && !turnstileToken)}
        type="submit"
        className="button-primary self-start px-4 py-2 text-xs font-medium disabled:opacity-60"
      >
        {busy ? "发布中..." : replyTo ? "发表回复" : "发表评论"}
      </button>
    </form>
  );
};
