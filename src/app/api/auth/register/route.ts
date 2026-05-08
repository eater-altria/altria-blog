import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { isValidUsername, normalizeUsername } from "@/lib/user-profile";
import { verifyTurnstileToken } from "@/lib/turnstile";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: { email?: string; password?: string; username?: string; turnstileToken?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体 JSON 格式错误" }, { status: 400 });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const username = normalizeUsername(body.username ?? "");
  const turnstileToken = body.turnstileToken ?? "";

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
    return NextResponse.json(
      { error: "密码长度至少为 8 位" },
      { status: 400 },
    );
  }

  const verified = await verifyTurnstileToken(req, turnstileToken);
  if (!verified.ok) {
    return NextResponse.json({ error: verified.message }, { status: verified.status ?? 400 });
  }

  const db = await getDb();
  const existing = await db.select().from(users).where(eq(users.email, email)).get();
  if (existing) {
    return NextResponse.json({ error: "该邮箱已被注册" }, { status: 409 });
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
    role: "user",
    createdAt,
  });

  return NextResponse.json({ ok: true, userId: id }, { status: 201 });
}
