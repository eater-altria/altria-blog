import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/guards";
import { isValidUsername, normalizeUsername } from "@/lib/user-profile";

export async function PATCH(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let body: { username?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体 JSON 格式错误" }, { status: 400 });
  }

  const username = normalizeUsername(body.username ?? "");
  if (!isValidUsername(username)) {
    return NextResponse.json(
      { error: "用户名需为 3-24 位，仅支持字母/数字/下划线" },
      { status: 400 },
    );
  }

  const db = await getDb();
  const existing = await db.select().from(users).where(eq(users.username, username)).get();
  if (existing && existing.id !== user.id) {
    return NextResponse.json({ error: "用户名已被占用" }, { status: 409 });
  }

  await db.update(users).set({ username }).where(eq(users.id, user.id));
  return NextResponse.json({ ok: true });
}
