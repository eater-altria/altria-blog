import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { findUserBySession } from "@/lib/auth/session";
import { isStaffRole } from "@/lib/auth/roles";
import type { User } from "@/db/schema";

export { isStaffRole } from "@/lib/auth/roles";

export const getCurrentUser = async (): Promise<User | null> => {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  return findUserBySession(sid);
};

/** `admin` or `super_admin` — for admin layout and most `/api/admin/*` routes. */
export const requireStaff = async (): Promise<User | null> => {
  const user = await getCurrentUser();
  if (!user || !isStaffRole(user.role)) {
    return null;
  }
  return user;
};

export const requireSuperAdmin = async (): Promise<User | null> => {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    return null;
  }
  return user;
};
