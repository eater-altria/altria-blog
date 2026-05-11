import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { requireSuperAdmin } from "@/lib/auth/guards";
import { isValidUsername, normalizeUsername } from "@/lib/user-profile";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 仅 super_admin：创建 `admin` 角色账号（不可创建 super_admin）。 */
export async function POST(req: Request) {
  const superAdmin = await requireSuperAdmin();
  if (!superAdmin) {
    return NextResponse.json({ error: "仅超级管理员可创建管理员账号" }, { status: 403 });
  }

  let body: { email?: string; password?: string; username?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体 JSON 格式错误" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const username = normalizeUsername(body.username ?? "");

  if (!isValidUsername(username)) {
    return NextResponse.json(
      { error: "用户名需为 3-24 位，仅支持字母/数字/下划线" },
      { status: 400 },
    );
  }

  if (!emailRe.test(email)) {
    return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "密码长度至少为 8 位" }, { status: 400 });
  }

  const db = await getDb();
  const existing = await db.select().from(users).where(eq(users.email, email)).get();
  if (existing) {
    return NextResponse.json({ error: "该邮箱已被使用" }, { status: 409 });
  }
  const existingUsername = await db.select().from(users).where(eq(users.username, username)).get();
  if (existingUsername) {
    return NextResponse.json({ error: "用户名已被占用" }, { status: 409 });
  }

  const id = crypto.randomUUID();
  const passwordHash = await hashPassword(password);
  const createdAt = Date.now();

  await db.insert(users).values({
    id,
    email,
    username,
    passwordHash,
    role: "admin",
    createdAt,
  });

  return NextResponse.json({ ok: true, userId: id }, { status: 201 });
}
