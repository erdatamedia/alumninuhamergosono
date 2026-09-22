import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import fs from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, isValidAdminToken } from "@/lib/admin-auth";
import { normalizeWhatsapp, isValidWhatsapp } from "@/lib/phone";
import { isValidAngkatan } from "@/lib/types";
import { isUniqueConstraintOn } from "@/lib/prisma-errors";

// Edit data alumni oleh admin — dipakai untuk membetulkan entri yang keliru
// (mis. typo nama/no HP) dari tahun-tahun sebelumnya.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const { id } = await params;
  const existing = await prisma.alumni.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Data alumni tidak ditemukan." }, { status: 404 });
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

  const angkatanMasukNum =
    angkatanMasuk === "" || angkatanMasuk === null || angkatanMasuk === undefined
      ? null
      : Number(angkatanMasuk);
  const angkatanLulusNum =
    angkatanLulus === "" || angkatanLulus === null || angkatanLulus === undefined
      ? null
      : Number(angkatanLulus);

  if (!isValidAngkatan(angkatanMasukNum) || !isValidAngkatan(angkatanLulusNum)) {
    return NextResponse.json({ error: "Angkatan masuk/lulus tidak valid." }, { status: 400 });
  }

  let alumni;
  try {
    alumni = await prisma.alumni.update({
      where: { id },
      data: {
        namaLengkap,
        noWhatsapp,
        alamat: alamat || null,
        angkatanMasuk: angkatanMasukNum,
        angkatanLulus: angkatanLulusNum,
      },
    });
  } catch (err) {
    if (isUniqueConstraintOn(err, "noWhatsapp")) {
      return NextResponse.json(
        { error: "Nomor WhatsApp sudah dipakai alumni lain." },
        { status: 409 },
      );
    }
    throw err;
  }

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

// Hapus alumni (dobel entri / salah input) — ikut hapus riwayat
// PartisipasiHaul & DoorprizeWinner terkait, plus file foto profil di disk.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const { id } = await params;
  const alumni = await prisma.alumni.findUnique({ where: { id } });
  if (!alumni) {
    return NextResponse.json({ error: "Data alumni tidak ditemukan." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.doorprizeWinner.deleteMany({ where: { alumniId: id } }),
    prisma.partisipasiHaul.deleteMany({ where: { alumniId: id } }),
    prisma.alumni.delete({ where: { id } }),
  ]);

  if (alumni.fotoUrl && alumni.fotoUrl.startsWith("/uploads/foto-profil/")) {
    const filePath = path.join(process.cwd(), "public", alumni.fotoUrl);
    await fs.unlink(filePath).catch(() => {
      // abaikan bila file sudah tidak ada
    });
  }

  return NextResponse.json({ ok: true });
}
