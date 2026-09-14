// Session dashboard alumni: cookie httpOnly berisi payload ditandatangani HMAC-SHA256.
// Pakai Web Crypto (bukan node:crypto) supaya jalan sama baik di runtime Node maupun middleware.

export const SESSION_COOKIE_NAME = "alumni_session";
export const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 hari

const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET belum di-set di environment.");
  return secret;
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

function bytesToBase64url(bytes: Uint8Array): string {
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64urlToBytes(str: string): Uint8Array {
  const padded = str.replace(/-/g, "+").replace(/_/g, "/").padEnd(str.length + ((4 - (str.length % 4)) % 4), "=");
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export async function createSessionToken(alumniId: string): Promise<string> {
  const payload = JSON.stringify({ alumniId, exp: Date.now() + SESSION_MAX_AGE_SECONDS * 1000 });
  const payloadB64 = bytesToBase64url(encoder.encode(payload));
  const key = await getKey();
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  return `${payloadB64}.${bytesToBase64url(new Uint8Array(sig))}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<{ alumniId: string } | null> {
  if (!token) return null;
  const [payloadB64, sigB64] = token.split(".");
  if (!payloadB64 || !sigB64) return null;

  try {
    const key = await getKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64urlToBytes(sigB64) as BufferSource,
      encoder.encode(payloadB64),
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(payloadB64)));
    if (typeof payload.alumniId !== "string") return null;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return { alumniId: payload.alumniId };
  } catch {
    return null;
  }
}
