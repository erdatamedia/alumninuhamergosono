import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsapp, isValidWhatsapp } from "@/lib/phone";
import { generateNia } from "@/lib/nia";

const TAHUN_ACARA = Number(process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026");

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const {
    alumniId,
    namaLengkap,
    noWhatsapp: rawPhone,
    alamat,
    angkatanMasuk,
    angkatanLulus,
    tahlilAkbar,
    haul,
    menginap,
  } = body;

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

  let alumni;

  if (alumniId) {
    const existing = await prisma.alumni.findUnique({ where: { id: alumniId } });
    if (!existing) {
      return NextResponse.json({ error: "Data alumni tidak ditemukan." }, { status: 404 });
    }
    const conflict = await prisma.alumni.findUnique({ where: { noWhatsapp } });
    if (conflict && conflict.id !== alumniId) {
      return NextResponse.json(
        { error: "Nomor WhatsApp sudah dipakai alumni lain. Hubungi sekretariat." },
        { status: 409 },
      );
    }
    alumni = await prisma.alumni.update({
      where: { id: alumniId },
      data: {
        namaLengkap,
        noWhatsapp,
        alamat: alamat || null,
        angkatanMasuk: angkatanMasukNum,
        angkatanLulus: angkatanLulusNum,
        dataVerifiedAt: new Date(),
      },
    });
  } else {
    const conflict = await prisma.alumni.findUnique({ where: { noWhatsapp } });
    if (conflict) {
      return NextResponse.json(
        { error: "Nomor WhatsApp ini sudah terdaftar. Silakan cari ulang." },
        { status: 409 },
      );
    }
    const nia = await generateNia(angkatanMasukNum);
    alumni = await prisma.alumni.create({
      data: {
        nia,
        namaLengkap,
        noWhatsapp,
        alamat: alamat || null,
        angkatanMasuk: angkatanMasukNum,
        angkatanLulus: angkatanLulusNum,
        source: "SELF_REGISTERED",
        dataVerifiedAt: new Date(),
      },
    });
  }

  const partisipasi = await prisma.partisipasiHaul.upsert({
    where: { alumniId_tahunAcara: { alumniId: alumni.id, tahunAcara: TAHUN_ACARA } },
    update: { tahlilAkbar, haul, menginap },
    create: {
      alumniId: alumni.id,
      tahunAcara: TAHUN_ACARA,
      tahlilAkbar,
      haul,
      menginap,
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
    partisipasi: {
      tahunAcara: partisipasi.tahunAcara,
      tahlilAkbar: partisipasi.tahlilAkbar,
      haul: partisipasi.haul,
      menginap: partisipasi.menginap,
    },
  });
}
