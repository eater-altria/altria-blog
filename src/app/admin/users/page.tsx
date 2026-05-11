import Link from "next/link";
import { redirect } from "next/navigation";
import { CreateAdminUserForm } from "@/components/forms/CreateAdminUserForm";
import { getCurrentUser } from "@/lib/auth/guards";

export default async function AdminUsersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    redirect("/admin");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin" className="story-link text-sm">
          ← 返回后台首页
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--foreground)]">管理员账号</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">仅超级管理员可在此创建普通管理员（admin）。</p>
      </div>
      <CreateAdminUserForm />
    </div>
  );
}
