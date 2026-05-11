import type { ReactNode } from "react";
import { Reveal } from "@/components/motion/Reveal";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <section className="grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(22rem,26rem)] lg:items-start">
      <Reveal className="space-y-6 pt-3">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--muted-strong)]">
          {eyebrow}
        </p>
        <div className="space-y-4">
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-[var(--foreground)] sm:text-5xl">
            {title}
          </h1>
          <p className="max-w-xl text-base leading-8 text-[var(--muted)]">{description}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="surface-card p-5">
            <p className="text-sm font-medium text-[var(--foreground)]">账户权限分层</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              普通用户可以注册、评论、维护个人资料，管理权限仍然留给手动配置的管理员账户。
            </p>
          </div>
          <div className="surface-card p-5">
            <p className="text-sm font-medium text-[var(--foreground)]">轻量但认真</p>
            <p className="mt-2 text-sm leading-7 text-[var(--muted)]">
              公开区尽量安静，把注意力让给文章本身；账户系统只在需要的时候出现。
            </p>
          </div>
        </div>
      </Reveal>
      <Reveal className="surface-card p-2" delay={1}>
        <div className="rounded-[1.4rem] border border-[var(--line-soft)] bg-[var(--surface-strong)] p-6 sm:p-8">
          {children}
          {footer ? <div className="mt-6 text-center text-sm text-[var(--muted)]">{footer}</div> : null}
        </div>
      </Reveal>
    </section>
  );
}
