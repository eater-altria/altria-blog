import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/auth/guards";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireSuperAdmin();
  if (!admin) {
    redirect("/login?next=/admin");
  }
  return <div className="flex flex-col gap-6">{children}</div>;
}
