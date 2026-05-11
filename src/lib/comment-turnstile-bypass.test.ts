import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCommentTurnstileBypassCookieValue,
  getCookieValueFromHeader,
  verifyCommentTurnstileBypassCookie,
} from "./comment-turnstile-bypass.ts";

const secret = "unit-test-secret-key-32chars!!";

test("getCookieValueFromHeader parses name", () => {
  assert.equal(
    getCookieValueFromHeader("a=1; cf_comment_ts_ok=hello%3Dworld; b=2", "cf_comment_ts_ok"),
    "hello=world",
  );
  assert.equal(getCookieValueFromHeader("other=1", "cf_comment_ts_ok"), undefined);
});

test("verifyCommentTurnstileBypassCookie accepts valid cookie for same user", async () => {
  const uid = "11111111-1111-1111-1111-111111111111";
  const raw = await buildCommentTurnstileBypassCookieValue(secret, uid);
  assert.equal(await verifyCommentTurnstileBypassCookie(raw, secret, uid), true);
});

test("verifyCommentTurnstileBypassCookie rejects wrong user", async () => {
  const uid = "11111111-1111-1111-1111-111111111111";
  const raw = await buildCommentTurnstileBypassCookieValue(secret, uid);
  assert.equal(await verifyCommentTurnstileBypassCookie(raw, secret, "22222222-2222-2222-2222-222222222222"), false);
});

test("verifyCommentTurnstileBypassCookie rejects tampered signature", async () => {
  const uid = "11111111-1111-1111-1111-111111111111";
  const raw = await buildCommentTurnstileBypassCookieValue(secret, uid);
  const tampered = `${raw.slice(0, -4)}xxxx`;
  assert.equal(await verifyCommentTurnstileBypassCookie(tampered, secret, uid), false);
});
