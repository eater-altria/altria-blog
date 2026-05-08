import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/forms/LoginForm";

export default function LoginPage() {
  return (
    <div className="flex flex-col">
      <h1 className="cyber-title text-center text-2xl font-semibold">欢迎回来</h1>
      <Suspense fallback={<p className="cyber-muted mt-6 text-center text-sm">加载中...</p>}>
        <LoginForm />
      </Suspense>
      <p className="cyber-muted mt-4 text-center text-sm">
        还没有账号？{" "}
        <Link className="cyber-link underline underline-offset-2" href="/register">
          去注册
        </Link>
      </p>
    </div>
  );
}
