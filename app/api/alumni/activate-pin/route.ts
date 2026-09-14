import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPin, verifyPin, isValidPinFormat, isPinTooSimple } from "@/lib/pin";
import { normalizeWhatsapp } from "@/lib/phone";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const alumniId = body?.alumniId;
  const pin = body?.pin;
  const confirmPin = body?.confirmPin;
  const oldPin = body?.oldPin;
  const verifyNoWhatsapp = body?.verifyNoWhatsapp;

  if (typeof alumniId !== "string" || !alumniId) {
    return NextResponse.json({ error: "Data alumni tidak valid." }, { status: 400 });
  }
  if (typeof pin !== "string" || typeof confirmPin !== "string") {
    return NextResponse.json({ error: "PIN wajib diisi." }, { status: 400 });
  }

  const alumni = await prisma.alumni.findUnique({ where: { id: alumniId } });
  if (!alumni) {
    return NextResponse.json({ error: "Data alumni tidak ditemukan." }, { status: 404 });
  }

  if (alumni.pinHash) {
    // Ganti PIN: wajib verifikasi PIN lama dulu.
    if (typeof oldPin !== "string" || !oldPin) {
      return NextResponse.json({ error: "Masukkan PIN lama untuk mengganti PIN." }, { status: 400 });
    }
    const oldPinValid = await verifyPin(oldPin, alumni.pinHash);
    if (!oldPinValid) {
      return NextResponse.json({ error: "PIN lama salah." }, { status: 401 });
    }
  } else {
    // Aktivasi pertama kali: wajib buktikan tahu nomor HP terdaftar —
    // alumniId saja (walau UUID sulit ditebak) tidak cukup untuk otorisasi.
    const verifyNormalized =
      typeof verifyNoWhatsapp === "string" ? normalizeWhatsapp(verifyNoWhatsapp) : "";
    if (verifyNormalized !== alumni.noWhatsapp) {
      return NextResponse.json(
        { error: "Verifikasi nomor HP tidak cocok. Silakan cari ulang dari halaman utama." },
        { status: 403 },
      );
    }
  }

  if (pin !== confirmPin) {
    return NextResponse.json({ error: "Konfirmasi PIN tidak cocok." }, { status: 400 });
  }
  if (!isValidPinFormat(pin)) {
    return NextResponse.json({ error: "PIN harus 6 digit angka." }, { status: 400 });
  }
  if (isPinTooSimple(pin)) {
    return NextResponse.json(
      { error: "PIN terlalu mudah ditebak (angka sama/berurutan). Gunakan kombinasi lain." },
      { status: 400 },
    );
  }

  const pinHash = await hashPin(pin);
  await prisma.alumni.update({
    where: { id: alumniId },
    data: { pinHash, pinFailedAttempt: 0, pinLockedUntil: null },
  });

  return NextResponse.json({ ok: true });
}
