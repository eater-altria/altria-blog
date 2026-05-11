import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  COMMENT_TURNSTILE_BYPASS_COOKIE,
  verifyCommentTurnstileBypassCookie,
} from "@/lib/comment-turnstile-bypass";

/** 服务端文章页：当前登录用户是否在评论 Turnstile 免验证窗口内。 */
export const getSkipCommentTurnstileForUser = async (userId: string): Promise<boolean> => {
  let secret: string | undefined;
  try {
    const { env } = await getCloudflareContext({ async: true });
    secret = env.TURNSTILE_SECRET_KEY;
  } catch {
    secret = process.env.TURNSTILE_SECRET_KEY;
  }
  const jar = await cookies();
  const raw = jar.get(COMMENT_TURNSTILE_BYPASS_COOKIE)?.value;
  return verifyCommentTurnstileBypassCookie(raw, secret, userId);
};
