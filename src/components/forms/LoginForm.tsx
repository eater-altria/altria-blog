"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "登录失败");
        setLoading(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("请求失败，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <form
      className="flex w-full flex-col gap-4"
      onSubmit={handleSubmit}
    >
      <h2 className="cyber-title text-2xl font-semibold tracking-tight">登录</h2>
      <label className="flex flex-col gap-1 text-sm">
        <span className="cyber-muted">邮箱</span>
        <input
          className="cyber-input px-4 py-3"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="cyber-muted">密码</span>
        <input
          className="cyber-input px-4 py-3"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      {error && (
        <p className="cyber-danger text-sm" role="alert">
          {error}
        </p>
      )}
      <button
        disabled={loading}
        type="submit"
        className="cyber-button mt-2 px-4 py-3 text-sm font-medium disabled:opacity-60"
      >
        {loading ? "登录中..." : "立即登录"}
      </button>
    </form>
  );
};
