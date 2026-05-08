import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { deleteSessionRecord } from "@/lib/auth/session";
import { SESSION_COOKIE } from "@/lib/constants";

export async function POST() {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  if (sid) {
    await deleteSessionRecord(sid);
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
