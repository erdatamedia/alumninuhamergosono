import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsapp, isValidWhatsapp } from "@/lib/phone";
import { verifyPin } from "@/lib/pin";
import { createSessionToken, SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "@/lib/session";

const GENERIC_ERROR = "Nomor HP atau PIN salah, atau dashboard belum diaktifkan.";
const MAX_ATTEMPT = 5;
const LOCK_DURATION_MS = 15 * 60 * 1000;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const rawPhone = body?.noWhatsapp;
  const pin = body?.pin;

  if (typeof rawPhone !== "string" || !rawPhone.trim() || typeof pin !== "string" || !pin) {
    return NextResponse.json({ error: "Nomor HP dan PIN wajib diisi." }, { status: 400 });
  }

  const noWhatsapp = normalizeWhatsapp(rawPhone);
  if (!isValidWhatsapp(noWhatsapp)) {
    return NextResponse.json({ error: "Format nomor HP tidak valid." }, { status: 400 });
  }

  const alumni = await prisma.alumni.findUnique({ where: { noWhatsapp } });

  // Nomor tidak ada ATAU dashboard belum diaktifkan: pesan generik yang sama,
  // supaya tidak bisa dipakai enumerasi nomor HP terdaftar.
  if (!alumni || !alumni.pinHash) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  if (alumni.pinLockedUntil && alumni.pinLockedUntil.getTime() > Date.now()) {
    const jam = alumni.pinLockedUntil.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });
    return NextResponse.json(
      { error: `Terlalu banyak percobaan gagal. Coba lagi setelah ${jam} WIB.` },
      { status: 429 },
    );
  }

  const valid = await verifyPin(pin, alumni.pinHash);

  if (!valid) {
    const nextAttempt = alumni.pinFailedAttempt + 1;
    if (nextAttempt >= MAX_ATTEMPT) {
      await prisma.alumni.update({
        where: { id: alumni.id },
        data: { pinFailedAttempt: 0, pinLockedUntil: new Date(Date.now() + LOCK_DURATION_MS) },
      });
    } else {
      await prisma.alumni.update({
        where: { id: alumni.id },
        data: { pinFailedAttempt: nextAttempt },
      });
    }
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  await prisma.alumni.update({
    where: { id: alumni.id },
    data: { pinFailedAttempt: 0, pinLockedUntil: null },
  });

  const token = await createSessionToken(alumni.id);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return res;
}
