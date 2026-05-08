import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { sessions, users } from "@/db/schema";
import { SESSION_MAX_AGE_MS } from "@/lib/constants";
import type { User } from "@/db/schema";

export const createSessionRecord = async (userId: string) => {
  const db = await getDb();
  const id = crypto.randomUUID();
  const expiresAt = Date.now() + SESSION_MAX_AGE_MS;
  await db.insert(sessions).values({
    id,
    userId,
    expiresAt,
  });
  return { sessionId: id, expiresAt };
};

export const deleteSessionRecord = async (sessionId: string) => {
  const db = await getDb();
  await db.delete(sessions).where(eq(sessions.id, sessionId));
};

export const findUserBySession = async (
  sessionId: string | undefined | null,
): Promise<User | null> => {
  if (!sessionId) {
    return null;
  }
  const db = await getDb();
  const row = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .get();
  if (!row) {
    return null;
  }
  if (row.session.expiresAt < Date.now()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return null;
  }
  return row.user;
};
