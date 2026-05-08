"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TurnstileWidget } from "@/components/forms/TurnstileWidget";

interface RegisterFormProps {
  siteKey?: string;
}

export const RegisterForm = ({ siteKey }: RegisterFormProps) => {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, turnstileToken }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "注册失败");
        setLoading(false);
        return;
      }
      router.push("/login");
      router.refresh();
    } catch {
      setError("请求失败，请稍后重试");
      setLoading(false);
    }
  };

  return (
    <form
      className="cyber-panel mx-auto mt-10 flex w-full max-w-md flex-col gap-4 p-6"
      onSubmit={handleSubmit}
    >
      <h1 className="cyber-title text-xl font-semibold">注册账号</h1>
      <p className="cyber-muted text-sm">
        通过此页面注册的账户默认为 <strong>user</strong> 角色，超级管理员需单独写入 D1。
      </p>
      <label className="flex flex-col gap-1 text-sm">
        <span className="cyber-muted">用户名（3-24位，字母/数字/下划线）</span>
        <input
          className="cyber-input px-3 py-2"
          type="text"
          autoComplete="username"
          value={username}
          minLength={3}
          maxLength={24}
          pattern="[a-zA-Z0-9_]{3,24}"
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="cyber-muted">邮箱</span>
        <input
          className="cyber-input px-3 py-2"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="cyber-muted">密码（至少 8 位）</span>
        <input
          className="cyber-input px-3 py-2"
          type="password"
          autoComplete="new-password"
          value={password}
          minLength={8}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </label>
      <TurnstileWidget siteKey={siteKey} onTokenChange={setTurnstileToken} />
      {error && (
        <p className="cyber-danger text-sm" role="alert">
          {error}
        </p>
      )}
      <button
        disabled={loading || !turnstileToken}
        type="submit"
        className="cyber-button px-4 py-2 text-sm font-medium disabled:opacity-60"
      >
        {loading ? "创建中..." : "创建账号"}
      </button>
    </form>
  );
};
