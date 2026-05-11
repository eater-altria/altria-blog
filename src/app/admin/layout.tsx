import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/guards";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await requireStaff();
  if (!staff) {
    redirect("/login?next=/admin");
  }
  return <div className="flex flex-col gap-6">{children}</div>;
}
