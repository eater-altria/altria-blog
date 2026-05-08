import { cookies } from "next/headers";
import { SESSION_COOKIE } from "@/lib/constants";
import { findUserBySession } from "@/lib/auth/session";
import type { User } from "@/db/schema";

export const getCurrentUser = async (): Promise<User | null> => {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  return findUserBySession(sid);
};

export const requireSuperAdmin = async (): Promise<User | null> => {
  const user = await getCurrentUser();
  if (!user || user.role !== "super_admin") {
    return null;
  }
  return user;
};
