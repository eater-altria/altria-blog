import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guards";
import { isStaffRole } from "@/lib/auth/roles";
import { LogoutButton } from "@/components/LogoutButton";

export const Nav = async () => {
  const user = await getCurrentUser();

  return (
    <header className="nav-enter sticky top-0 z-30 border-b border-[var(--line-soft)] bg-[rgba(244,239,230,0.86)] backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex min-w-0 flex-col">
          <span className="text-xs font-medium uppercase tracking-[0.28em] text-[var(--muted-strong)]">
            Altria
          </span>
          <span className="text-lg font-semibold tracking-tight text-[var(--foreground)]">
            Journal
          </span>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm sm:gap-3">
          <Link href="/writing" className="rounded-full px-3 py-2 text-[var(--muted)] hover:bg-white/60 hover:text-[var(--foreground)]">
            写作
          </Link>
          <Link href="/rss.xml" className="rounded-full px-3 py-2 text-[var(--muted)] hover:bg-white/60 hover:text-[var(--foreground)]">
            订阅
          </Link>
          {user && isStaffRole(user.role) && (
            <Link href="/admin" className="soft-pill px-3 py-1.5 text-xs font-medium">
              管理后台
            </Link>
          )}
          {!user ? (
            <>
              <Link href="/login" className="rounded-full px-3 py-2 text-[var(--muted)] hover:bg-white/60 hover:text-[var(--foreground)]">
                登录
              </Link>
              <Link href="/register" className="button-primary px-4 py-2 text-xs font-medium">
                注册
              </Link>
            </>
          ) : (
            <>
              <Link href="/me" className="rounded-full px-3 py-2 text-xs text-[var(--muted)] hover:bg-white/60 hover:text-[var(--foreground)]" title="用户中心">
                我的资料
              </Link>
              <span className="max-w-[180px] truncate rounded-full border border-[var(--line-soft)] bg-white/50 px-3 py-2 text-xs text-[var(--muted)]" title={user.email}>
                {user.username ?? user.email}
              </span>
              <LogoutButton />
            </>
          )}
        </nav>
      </div>
    </header>
  );
};
