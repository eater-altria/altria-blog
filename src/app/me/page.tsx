import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/guards";
import { ProfileForm } from "@/components/forms/ProfileForm";

export default async function UserCenterPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <ProfileForm
      username={user.username ?? ""}
      avatarUrl={user.avatarUrl ?? null}
    />
  );
}
