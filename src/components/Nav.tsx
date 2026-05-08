import Link from "next/link";
import { getCurrentUser } from "@/lib/auth/guards";
import { LogoutButton } from "@/components/LogoutButton";

export const Nav = async () => {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-cyan-400/20 bg-[#05070d]/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="rounded-full border border-fuchsia-400/40 bg-fuchsia-400/10 px-3 py-1 text-sm font-semibold tracking-[0.22em] text-cyan-200 shadow-[0_0_18px_rgba(255,43,214,0.35)]"
        >
          ALTRIA BLOG
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/posts" className="cyber-link">
            文章
          </Link>
          <Link href="/rss.xml" className="cyber-link">
            订阅
          </Link>
          {user?.role === "super_admin" && (
            <Link href="/admin" className="cyber-chip px-3 py-1 text-xs font-semibold tracking-wide">
              管理后台
            </Link>
          )}
          {!user ? (
            <>
              <Link href="/login" className="cyber-link">
                登录
              </Link>
              <Link href="/register" className="cyber-button px-3 py-1.5 text-xs font-semibold tracking-wide">
                注册
              </Link>
            </>
          ) : (
            <>
              <Link href="/me" className="cyber-link text-xs" title="用户中心">
                用户中心
              </Link>
              <span className="max-w-[180px] truncate text-xs text-cyan-100/85" title={user.email}>
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
