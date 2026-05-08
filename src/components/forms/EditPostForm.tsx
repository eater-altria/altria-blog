"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface EditPostFormProps {
  postId: string;
  initialMarkdown: string;
}

export const EditPostForm = ({ postId, initialMarkdown }: EditPostFormProps) => {
  const router = useRouter();
  const [markdown, setMarkdown] = useState(initialMarkdown);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "保存失败");
        setBusy(false);
        return;
      }
      router.refresh();
      setBusy(false);
    } catch {
      setError("请求失败，请稍后重试");
      setBusy(false);
    }
  };

  const handlePublish = async () => {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}/publish`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "发布失败");
        setBusy(false);
        return;
      }
      router.refresh();
      setBusy(false);
    } catch {
      setError("请求失败，请稍后重试");
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form className="flex flex-col gap-3" onSubmit={handleSave}>
        <textarea
          className="cyber-input min-h-[360px] p-3 font-mono text-sm"
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          aria-label="Markdown 草稿内容"
          required
        />
        <div className="flex flex-wrap gap-3">
          <button
            disabled={busy}
            type="submit"
            className="cyber-button-secondary px-4 py-2 text-sm disabled:opacity-60"
          >
            保存草稿
          </button>
          <a
            className="cyber-link inline-flex rounded-full border border-transparent px-4 py-2 text-sm underline-offset-2 hover:underline"
            href={`/admin/posts/${postId}/preview`}
            target="_blank"
            rel="noreferrer"
          >
            预览草稿
          </a>
          <button
            disabled={busy}
            type="button"
            className="cyber-button px-4 py-2 text-sm font-medium disabled:opacity-60"
            onClick={handlePublish}
          >
            发布（覆盖线上快照）
          </button>
        </div>
      </form>
      {error && (
        <p className="cyber-danger text-sm" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
