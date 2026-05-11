/** Roles that may use the writing admin UI (drafts, publish, uploads). */
export const isStaffRole = (role: string): role is "admin" | "super_admin" =>
  role === "admin" || role === "super_admin";
