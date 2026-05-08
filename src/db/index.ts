import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export async function getDb() {
  const { env } = await getCloudflareContext({ async: true });
  const binding = env.DB;
  if (!binding) {
    throw new Error("D1 binding DB is not configured");
  }
  return drizzle(binding, { schema });
}

export type Db = Awaited<ReturnType<typeof getDb>>;
