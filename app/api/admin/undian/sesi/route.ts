import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, isValidAdminToken } from "@/lib/admin-auth";

const TAHUN_ACARA = Number(process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026");
const MIN_DURASI_MENIT = 1;
const MAX_DURASI_MENIT = 60;

function serialize(session: {
  id: string;
  token: string;
  expiresAt: Date;
  closedAt: Date | null;
  createdAt: Date;
  entries: { id: string }[];
}) {
  return {
    id: session.id,
    token: session.token,
    expiresAt: session.expiresAt,
    closedAt: session.closedAt,
    createdAt: session.createdAt,
    entryCount: session.entries.length,
    active: !session.closedAt && session.expiresAt.getTime() > Date.now(),
  };
}

// Sesi presensi terbaru untuk tahun acara berjalan — dipakai halaman admin
// undian untuk polling status (countdown, jumlah yang sudah scan).
export async function GET() {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const session = await prisma.doorprizeSession.findFirst({
    where: { tahunAcara: TAHUN_ACARA },
    orderBy: { createdAt: "desc" },
    include: { entries: { select: { id: true } } },
  });

  return NextResponse.json({ session: session ? serialize(session) : null });
}

// Buka sesi presensi baru. Sesi lama (kalau masih aktif) otomatis ditutup —
// hanya boleh ada satu sesi aktif per waktu supaya QR yang beredar jelas
// yang mana yang berlaku.
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const durasiMenit = Number(body?.durasiMenit);
  if (!Number.isFinite(durasiMenit) || durasiMenit < MIN_DURASI_MENIT || durasiMenit > MAX_DURASI_MENIT) {
    return NextResponse.json(
      { error: `Durasi harus antara ${MIN_DURASI_MENIT}-${MAX_DURASI_MENIT} menit.` },
      { status: 400 },
    );
  }

  await prisma.doorprizeSession.updateMany({
    where: { tahunAcara: TAHUN_ACARA, closedAt: null },
    data: { closedAt: new Date() },
  });

  const session = await prisma.doorprizeSession.create({
    data: {
      tahunAcara: TAHUN_ACARA,
      token: crypto.randomBytes(16).toString("hex"),
      expiresAt: new Date(Date.now() + durasiMenit * 60 * 1000),
    },
    include: { entries: { select: { id: true } } },
  });

  return NextResponse.json({ session: serialize(session) });
}

// Tutup sesi lebih awal sebelum waktunya habis.
export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const sessionId = body?.sessionId;
  if (typeof sessionId !== "string" || !sessionId) {
    return NextResponse.json({ error: "ID sesi tidak valid." }, { status: 400 });
  }

  const session = await prisma.doorprizeSession.findUnique({ where: { id: sessionId } });
  if (!session || session.tahunAcara !== TAHUN_ACARA) {
    return NextResponse.json({ error: "Sesi tidak ditemukan." }, { status: 404 });
  }

  const updated = await prisma.doorprizeSession.update({
    where: { id: sessionId },
    data: { closedAt: new Date() },
    include: { entries: { select: { id: true } } },
  });

  return NextResponse.json({ session: serialize(updated) });
}
