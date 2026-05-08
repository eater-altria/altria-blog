"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export const NewPostForm = () => {
  const router = useRouter();
  const [markdown, setMarkdown] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/posts", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "保存文章失败");
        setBusy(false);
        return;
      }
      const id = (data as { id?: string }).id;
      router.push(`/admin/posts/${id}`);
      router.refresh();
    } catch {
      setError("请求失败，请稍后重试");
      setBusy(false);
    }
  };

  return (
    <form className="mt-8 flex flex-col gap-4" onSubmit={handleSubmit}>
      <textarea
        className="cyber-input min-h-[320px] p-3 font-mono text-sm"
        placeholder={"---\\ntitle: 文章标题\\nslug: article-slug\\n---\\n\\n在这里写 Markdown..."}
        value={markdown}
        onChange={(e) => setMarkdown(e.target.value)}
        required
      />
      <p className="cyber-muted text-xs">
        可选 YAML frontmatter：<code className="font-mono">title</code>、{" "}
        <code className="font-mono">slug</code>。保存后仍是草稿，发布后访客才可见。
      </p>
      {error && (
        <p className="cyber-danger text-sm" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <button
          disabled={busy}
          type="submit"
          className="cyber-button px-4 py-2 text-sm font-medium disabled:opacity-60"
        >
          {busy ? "保存中..." : "保存草稿"}
        </button>
      </div>
    </form>
  );
};
