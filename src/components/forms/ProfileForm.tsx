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
    <div className="cyber-panel mx-auto mt-8 flex w-full max-w-xl flex-col gap-6 p-6">
      <h1 className="cyber-title text-xl font-semibold">用户中心</h1>
      <section className="flex items-center gap-4">
        <div className="h-14 w-14 overflow-hidden rounded-full border border-cyan-400/40 bg-[#0d1b35]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-cyan-200/70">无头像</div>
          )}
        </div>
        <p className="cyber-muted text-sm">可上传 PNG/JPEG/WEBP，最大 2MB。</p>
      </section>

      <form className="flex flex-col gap-2" onSubmit={handleUsernameSubmit}>
        <label htmlFor="profile-username" className="text-sm cyber-muted">用户名</label>
        <input
          id="profile-username"
          className="cyber-input px-3 py-2"
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
          className="cyber-button self-start px-3 py-1 text-xs font-medium disabled:opacity-60"
        >
          {savingName ? "保存中..." : "保存用户名"}
        </button>
      </form>

      <form className="flex flex-col gap-2" onSubmit={handleAvatarSubmit}>
        <label htmlFor="profile-avatar" className="text-sm cyber-muted">头像文件</label>
        <input
          id="profile-avatar"
          className="cyber-input px-3 py-2 text-sm"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
        />
        <button
          type="submit"
          disabled={savingAvatar}
          className="cyber-button self-start px-3 py-1 text-xs font-medium disabled:opacity-60"
        >
          {savingAvatar ? "上传中..." : "上传头像"}
        </button>
      </form>

      {error && <p className="cyber-danger text-sm">{error}</p>}
      {ok && <p className="text-sm text-emerald-300">{ok}</p>}
    </div>
  );
};
