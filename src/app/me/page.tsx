import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { ProfileForm } from "@/components/forms/ProfileForm";

export default async function UserCenterPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <section className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(20rem,30rem)] lg:items-start">
      <div className="space-y-6">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-[var(--muted-strong)]">
          Profile
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-[var(--foreground)]">
          维护你的公开身份。
        </h1>
        <p className="max-w-xl text-base leading-8 text-[var(--muted)]">
          这里可以修改用户名和头像。评论区会展示这些信息，所以尽量让它既好认，又是你自己喜欢的样子。
        </p>
      </div>
      <ProfileForm username={user.username ?? ""} avatarUrl={user.avatarUrl ?? null} />
    </section>
  );
}
