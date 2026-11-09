// Admin sign-in until Supabase Auth replaces it in Phase 2: one owner password from ADMIN_PASSWORD,
// and a signed, expiring cookie. Uses Web Crypto so it runs in the proxy and in Server Actions alike.

export const SESSION_COOKIE = "tafara_admin";
export const SESSION_DAYS = 14;

function secret() {
  return process.env.ADMIN_SECRET || process.env.ADMIN_PASSWORD || "";
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret()), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
  ]);
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return btoa(String.fromCharCode(...new Uint8Array(mac))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Constant-time comparison so a wrong guess takes as long as a nearly right one. */
function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const adminConfigured = () => Boolean(process.env.ADMIN_PASSWORD);

export function passwordMatches(attempt: string) {
  return adminConfigured() && same(attempt, process.env.ADMIN_PASSWORD!);
}

export async function createSession() {
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  return `${expires}.${await sign(String(expires))}`;
}

export async function verifySession(token: string | undefined) {
  if (!token || !adminConfigured()) return false;
  const [expires, mac] = token.split(".");
  if (!expires || !mac || Number(expires) < Date.now()) return false;
  return same(mac, await sign(expires));
}
