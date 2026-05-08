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
      className="rounded-full border border-fuchsia-400/45 bg-fuchsia-400/10 px-3 py-1 text-xs font-medium text-fuchsia-200 transition hover:border-fuchsia-300 hover:text-white hover:shadow-[0_0_14px_rgba(255,43,214,0.5)]"
      onClick={handleClick}
    >
      Sign out
    </button>
  );
};
