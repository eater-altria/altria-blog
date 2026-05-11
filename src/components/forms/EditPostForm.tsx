"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MarkdownEditor } from "@/components/forms/MarkdownEditor";

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

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "确定要删除这篇文章吗？草稿、已发布快照和评论都会一起删除，而且不能恢复。",
    );
    if (!confirmed) return;

    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/posts/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "删除失败");
        setBusy(false);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch {
      setError("请求失败，请稍后重试");
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <form className="flex flex-col gap-3" onSubmit={handleSave}>
        <MarkdownEditor
          label="Markdown 草稿"
          minHeightClassName="min-h-[560px]"
          value={markdown}
          onChange={setMarkdown}
          aria-label="Markdown 草稿内容"
          required
          disabled={busy}
          footer={
            <p className="text-xs text-[var(--muted)]">
              草稿支持实时预览，也支持直接粘贴截图上传到 R2 的 <code>/image/blog/</code> 路径。
            </p>
          }
        />
        <div className="flex flex-wrap gap-3">
          <button
            disabled={busy}
            type="submit"
            className="cyber-button-secondary px-4 py-2.5 text-sm disabled:opacity-60"
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
            className="cyber-button px-4 py-2.5 text-sm font-medium disabled:opacity-60"
            onClick={handlePublish}
          >
            发布（覆盖线上快照）
          </button>
          <button
            disabled={busy}
            type="button"
            className="rounded-full border border-[rgba(177,69,61,0.24)] bg-[rgba(177,69,61,0.08)] px-4 py-2.5 text-sm font-medium text-[var(--danger)] transition hover:bg-[rgba(177,69,61,0.14)] disabled:opacity-60"
            onClick={handleDelete}
          >
            删除文章
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
