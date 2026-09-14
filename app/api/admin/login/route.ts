import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_TOKEN_MAX_AGE_SECONDS,
  makeAdminToken,
  timingSafeStringEqual,
} from "@/lib/admin-auth";
import { checkRateLimit, getClientIp, formatRetryAfter } from "@/lib/rate-limit";

const MAX_ATTEMPT = 5;
const WINDOW_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rate = checkRateLimit(`admin-login:${ip}`, MAX_ATTEMPT, WINDOW_MS);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Terlalu banyak percobaan gagal. Coba lagi ${formatRetryAfter(rate.retryAfterMs)}.`,
      },
      { status: 429 },
    );
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  const body = await req.json().catch(() => null);
  const password = body?.password;

  if (
    typeof password !== "string" ||
    !adminPassword ||
    !timingSafeStringEqual(password, adminPassword)
  ) {
    return NextResponse.json({ error: "Password salah." }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE_NAME, makeAdminToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_TOKEN_MAX_AGE_SECONDS,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}
