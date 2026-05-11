import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";
import { AuthShell } from "@/components/site/AuthShell";

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Account"
      title="欢迎回来。"
      description="登录后你可以评论文章、维护个人资料，也能把这个博客当成一个会记住你的阅读现场。"
      footer={
        <>
          还没有账号？{" "}
          <Link className="story-link font-medium text-[var(--accent)]" href="/register">
            去注册
          </Link>
        </>
      }
    >
      <Suspense fallback={<p className="text-center text-sm text-[var(--muted)]">加载中...</p>}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
