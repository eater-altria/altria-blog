import assert from "node:assert/strict";
import test from "node:test";
import { buildPlaceholderUsername, isValidUsername, validateAvatarFile } from "./user-profile.ts";
import { isTurnstileVerificationSuccess } from "./turnstile.ts";

test("username validation accepts policy-compliant username", () => {
  assert.equal(isValidUsername("alice_123"), true);
  assert.equal(isValidUsername("ab"), false);
  assert.equal(isValidUsername("invalid-name"), false);
});

test("placeholder username is deterministic from user id", () => {
  assert.equal(
    buildPlaceholderUsername("9f1f74b7-1234-4d20-8bd0-3f91f2b67111"),
    "user_9f1f74b7",
  );
});

test("avatar validator rejects unsupported file type", () => {
  const file = new File(["hello"], "a.gif", { type: "image/gif" });
  assert.equal(validateAvatarFile(file), "仅支持 PNG/JPEG/WEBP 格式头像");
});

test("avatar validator rejects oversize files", () => {
  const bytes = new Uint8Array(2 * 1024 * 1024 + 1);
  const file = new File([bytes], "big.png", { type: "image/png" });
  assert.equal(validateAvatarFile(file), "头像大小不能超过 2MB");
});

test("turnstile verification parser handles pass/fail", () => {
  assert.equal(isTurnstileVerificationSuccess({ success: true }), true);
  assert.equal(isTurnstileVerificationSuccess({ success: false }), false);
  assert.equal(isTurnstileVerificationSuccess({}), false);
});
