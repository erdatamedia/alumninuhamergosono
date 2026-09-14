import crypto from "node:crypto";

export const ADMIN_COOKIE_NAME = "admin_session";
export const ADMIN_TOKEN_MAX_AGE_SECONDS = 8 * 60 * 60; // 8 jam

function getSecret(): string {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) throw new Error("ADMIN_PASSWORD belum di-set di environment.");
  return secret;
}

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function timingSafeStringEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

/** Token membawa expiry di dalam payload yang ditandatangani, jadi kedaluwarsa
 * benar-benar diverifikasi di server — bukan cuma diandalkan lewat maxAge cookie. */
export function makeAdminToken(): string {
  const exp = Date.now() + ADMIN_TOKEN_MAX_AGE_SECONDS * 1000;
  const payload = `admin-authenticated:${exp}`;
  return `${payload}.${sign(payload)}`;
}

export function isValidAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  try {
    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return false;
    const payload = token.slice(0, dotIndex);
    const sig = token.slice(dotIndex + 1);

    if (!timingSafeStringEqual(sig, sign(payload))) return false;

    const exp = Number(payload.split(":")[1]);
    if (!Number.isFinite(exp) || exp < Date.now()) return false;

    return true;
  } catch {
    return false;
  }
}
