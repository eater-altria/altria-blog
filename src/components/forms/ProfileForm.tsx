"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProfileFormProps {
  username: string;
  avatarUrl: string | null;
}

export const ProfileForm = ({ username, avatarUrl }: ProfileFormProps) => {
  const router = useRouter();
  const [nextUsername, setNextUsername] = useState(username);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [savingName, setSavingName] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingName(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: nextUsername }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "用户名更新失败");
        setSavingName(false);
        return;
      }
      setOk("用户名已更新");
      setSavingName(false);
      router.refresh();
    } catch {
      setError("请求失败，请稍后重试");
      setSavingName(false);
    }
  };

  const handleAvatarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avatarFile) {
      setError("请先选择头像文件");
      return;
    }
    setSavingAvatar(true);
    setError(null);
    setOk(null);
    try {
      const fd = new FormData();
      fd.set("avatar", avatarFile);
      const res = await fetch("/api/auth/profile/avatar", { method: "POST", body: fd });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "头像上传失败");
        setSavingAvatar(false);
        return;
      }
      setAvatarFile(null);
      setOk("头像已更新");
      setSavingAvatar(false);
      router.refresh();
    } catch {
      setError("请求失败，请稍后重试");
      setSavingAvatar(false);
    }
  };

  return (
    <div className="surface-card flex w-full max-w-xl flex-col gap-6 p-6 sm:p-7">
      <h2 className="text-2xl font-semibold tracking-tight text-[var(--foreground)]">用户中心</h2>
      <section className="flex items-center gap-4">
        <div className="h-14 w-14 overflow-hidden rounded-full border border-[var(--surface-border)] bg-[var(--surface-strong)]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-[var(--muted-strong)]">无头像</div>
          )}
        </div>
        <p className="text-sm text-[var(--muted)]">可上传 PNG/JPEG/WEBP，最大 2MB。</p>
      </section>

      <form className="flex flex-col gap-2" onSubmit={handleUsernameSubmit}>
        <label htmlFor="profile-username" className="text-sm text-[var(--muted)]">
          用户名
        </label>
        <input
          id="profile-username"
          className="input-shell px-4 py-3"
          value={nextUsername}
          minLength={3}
          maxLength={24}
          pattern="[a-zA-Z0-9_]{3,24}"
          onChange={(e) => setNextUsername(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={savingName}
          className="button-primary self-start px-4 py-2 text-xs font-medium disabled:opacity-60"
        >
          {savingName ? "保存中..." : "保存用户名"}
        </button>
      </form>

      <form className="flex flex-col gap-2" onSubmit={handleAvatarSubmit}>
        <label htmlFor="profile-avatar" className="text-sm text-[var(--muted)]">
          头像文件
        </label>
        <input
          id="profile-avatar"
          className="input-shell px-4 py-3 text-sm"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="submit"
          disabled={savingAvatar}
          className="button-primary self-start px-4 py-2 text-xs font-medium disabled:opacity-60"
        >
          {savingAvatar ? "上传中..." : "上传头像"}
        </button>
      </form>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {ok && <p className="text-sm text-[var(--accent)]">{ok}</p>}
    </div>
  );
};
