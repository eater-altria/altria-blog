import Link from "next/link";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { getTurnstileSiteKey } from "@/lib/public-env";
import { AuthShell } from "@/components/site/AuthShell";

export default async function RegisterPage() {
  const siteKey = await getTurnstileSiteKey();

  return (
    <AuthShell
      eyebrow="Join"
      title="给自己留一个席位。"
      description="注册之后你可以在文章下留言，也能维护用户名和头像。这个博客不会很吵，但希望它对熟悉的人越来越亲切。"
      footer={
        <>
          已有账号？{" "}
          <Link className="story-link font-medium text-[var(--accent)]" href="/login">
            去登录
          </Link>
        </>
      }
    >
      <RegisterForm siteKey={siteKey} />
    </AuthShell>
  );
}
