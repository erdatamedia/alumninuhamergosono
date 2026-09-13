import crypto from "node:crypto";

export const ADMIN_COOKIE_NAME = "admin_session";

function getSecret(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD belum di-set di environment.");
  return secret;
}

export function makeAdminToken(): string {
  return crypto.createHmac("sha256", getSecret()).update("admin-authenticated").digest("hex");
}

export function isValidAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  try {
    const expected = makeAdminToken();
    const a = Buffer.from(token);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
