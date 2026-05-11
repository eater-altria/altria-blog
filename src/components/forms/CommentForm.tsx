"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TurnstileWidget } from "@/components/forms/TurnstileWidget";

interface CommentFormProps {
  slug: string;
  siteKey?: string;
}

export const CommentForm = ({ slug, siteKey }: CommentFormProps) => {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${slug}/comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, turnstileToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "评论发布失败");
        setBusy(false);
        return;
      }
      setBody("");
      setTurnstileToken("");
      router.refresh();
      setBusy(false);
    } catch {
      setError("请求失败，请稍后重试");
      setBusy(false);
    }
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
      <textarea
        className="cyber-input min-h-[120px] p-4 text-sm leading-7"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={5000}
        placeholder="写下你的评论..."
      />
      <TurnstileWidget siteKey={siteKey} onTokenChange={setTurnstileToken} />
      {error && (
        <p className="cyber-danger text-xs">{error}</p>
      )}
      <button
        disabled={busy || !turnstileToken}
        type="submit"
        className="cyber-button self-start px-4 py-2 text-xs font-medium disabled:opacity-60"
      >
        {busy ? "发布中..." : "发表评论"}
      </button>
    </form>
  );
};
