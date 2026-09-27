import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsapp, isValidWhatsapp } from "@/lib/phone";
import { checkRateLimit, getClientIp, formatRetryAfter } from "@/lib/rate-limit";

const MAX_ATTEMPT = 10;
const WINDOW_MS = 60 * 1000;

// Endpoint publik: alumni scan QR sesi presensi undian lewat HP masing-masing
// lalu masukkan nomor WA-nya sendiri untuk membuktikan hadir. Syarat: sesi
// masih berlaku (belum expired/ditutup) dan data alumni sudah terverifikasi.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rate = checkRateLimit(`undian-masuk:${ip}`, MAX_ATTEMPT, WINDOW_MS);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Terlalu banyak percobaan. Coba lagi ${formatRetryAfter(rate.retryAfterMs)}.` },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const token = body?.token;
  const rawPhone = body?.noWhatsapp;

  if (typeof token !== "string" || !token) {
    return NextResponse.json({ error: "Sesi tidak valid." }, { status: 400 });
  }
  if (typeof rawPhone !== "string" || !rawPhone.trim()) {
    return NextResponse.json({ error: "Nomor WhatsApp wajib diisi." }, { status: 400 });
  }

  const noWhatsapp = normalizeWhatsapp(rawPhone);
  if (!isValidWhatsapp(noWhatsapp)) {
    return NextResponse.json({ error: "Format nomor WhatsApp tidak valid." }, { status: 400 });
  }

  const session = await prisma.doorprizeSession.findUnique({ where: { token } });
  if (!session) {
    return NextResponse.json({ error: "Sesi presensi tidak ditemukan." }, { status: 404 });
  }
  if (session.closedAt || session.expiresAt.getTime() <= Date.now()) {
    return NextResponse.json(
      { error: "Sesi presensi sudah ditutup. Waktu untuk daftar undian sudah habis." },
      { status: 410 },
    );
  }

  const alumni = await prisma.alumni.findUnique({ where: { noWhatsapp } });
  if (!alumni) {
    return NextResponse.json(
      { error: "Nomor tidak ditemukan. Pastikan sudah mengisi data alumni di halaman utama." },
      { status: 404 },
    );
  }
  if (!alumni.dataVerifiedAt) {
    return NextResponse.json(
      {
        error:
          "Data Anda belum terverifikasi. Silakan konfirmasi data di halaman utama terlebih dahulu sebelum ikut undian.",
      },
      { status: 403 },
    );
  }

  const existing = await prisma.doorprizeEntry.findUnique({
    where: { sessionId_alumniId: { sessionId: session.id, alumniId: alumni.id } },
  });
  if (!existing) {
    await prisma.doorprizeEntry.create({
      data: { sessionId: session.id, alumniId: alumni.id },
    });
  }

  return NextResponse.json({ ok: true, namaLengkap: alumni.namaLengkap, alreadyRegistered: Boolean(existing) });
}
