import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsapp, isValidWhatsapp } from "@/lib/phone";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";

// Update profil dari dashboard alumni (bukan alur wizard) — hanya menyentuh
// data Alumni, tidak pernah menyentuh PartisipasiHaul tahun berjalan.
export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) {
    return NextResponse.json({ error: "Sesi tidak valid, silakan login ulang." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const namaLengkap = body?.namaLengkap;
  const rawPhone = body?.noWhatsapp;
  const alamat = body?.alamat;
  const angkatanMasuk = body?.angkatanMasuk;
  const angkatanLulus = body?.angkatanLulus;

  if (typeof namaLengkap !== "string" || !namaLengkap.trim()) {
    return NextResponse.json({ error: "Nama lengkap wajib diisi." }, { status: 400 });
  }
  if (typeof rawPhone !== "string" || !rawPhone.trim()) {
    return NextResponse.json({ error: "Nomor WhatsApp wajib diisi." }, { status: 400 });
  }

  const noWhatsapp = normalizeWhatsapp(rawPhone);
  if (!isValidWhatsapp(noWhatsapp)) {
    return NextResponse.json({ error: "Format nomor WhatsApp tidak valid." }, { status: 400 });
  }

  const conflict = await prisma.alumni.findUnique({ where: { noWhatsapp } });
  if (conflict && conflict.id !== session.alumniId) {
    return NextResponse.json(
      { error: "Nomor WhatsApp sudah dipakai alumni lain. Hubungi sekretariat." },
      { status: 409 },
    );
  }

  const angkatanMasukNum =
    angkatanMasuk === "" || angkatanMasuk === null || angkatanMasuk === undefined
      ? null
      : Number(angkatanMasuk);
  const angkatanLulusNum =
    angkatanLulus === "" || angkatanLulus === null || angkatanLulus === undefined
      ? null
      : Number(angkatanLulus);

  const alumni = await prisma.alumni.update({
    where: { id: session.alumniId },
    data: {
      namaLengkap,
      noWhatsapp,
      alamat: alamat || null,
      angkatanMasuk: angkatanMasukNum,
      angkatanLulus: angkatanLulusNum,
      dataVerifiedAt: new Date(),
    },
  });

  return NextResponse.json({
    alumni: {
      id: alumni.id,
      nia: alumni.nia,
      namaLengkap: alumni.namaLengkap,
      noWhatsapp: alumni.noWhatsapp,
      alamat: alumni.alamat,
      angkatanMasuk: alumni.angkatanMasuk,
      angkatanLulus: alumni.angkatanLulus,
    },
  });
}
