"use client";

export const LogoutButton = () => {
  const handleClick = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    window.location.href = "/";
  };

  return (
    <button
      type="button"
      className="rounded-full border border-[var(--surface-border)] bg-[var(--surface-raised)] px-3 py-2 text-xs font-medium text-[var(--muted)] transition hover:border-[var(--line-strong)] hover:bg-[var(--surface-raised-strong)] hover:text-[var(--foreground)]"
      onClick={handleClick}
    >
      退出登录
    </button>
  );
};
