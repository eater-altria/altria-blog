import Link from "next/link";
import { RegisterForm } from "@/components/forms/RegisterForm";
import { getTurnstileSiteKey } from "@/lib/public-env";

export default async function RegisterPage() {
  const siteKey = await getTurnstileSiteKey();

  return (
    <div className="flex flex-col">
      <RegisterForm siteKey={siteKey} />
      <p className="cyber-muted mt-4 text-center text-sm">
        已有账号？{" "}
        <Link className="cyber-link underline underline-offset-2" href="/login">
          去登录
        </Link>
      </p>
    </div>
  );
}
