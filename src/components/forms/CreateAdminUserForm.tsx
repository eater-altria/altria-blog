"use client";

import { useState } from "react";

export const CreateAdminUserForm = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "创建失败");
        setLoading(false);
        return;
      }
      setSuccess("已创建管理员账号，对方可使用该邮箱登录后台。");
      setUsername("");
      setEmail("");
      setPassword("");
      setLoading(false);
    } catch {
      setError("请求失败，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <form className="surface-card flex max-w-xl flex-col gap-4 p-6" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-lg font-semibold text-[var(--foreground)]">新建普通管理员</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          角色为 <code className="rounded bg-black/5 px-1">admin</code>
          ：可写文章与发布，不可删文章、删评论或再创建管理员。
        </p>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--muted)]">用户名（3–24 位，字母/数字/下划线）</span>
        <input
          className="input-shell px-4 py-3"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="off"
          minLength={3}
          maxLength={24}
          pattern="[a-zA-Z0-9_]{3,24}"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--muted)]">邮箱</span>
        <input
          className="input-shell px-4 py-3"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="off"
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-[var(--muted)]">初始密码（至少 8 位，请安全告知对方）</span>
        <input
          className="input-shell px-4 py-3"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>
      {error ? (
        <p className="text-sm text-[var(--danger)]" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-[var(--accent)]" role="status">
          {success}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="button-primary self-start px-4 py-2.5 text-sm font-medium disabled:opacity-60"
      >
        {loading ? "创建中…" : "创建管理员"}
      </button>
    </form>
  );
};
