import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsapp, isValidWhatsapp } from "@/lib/phone";
import { generateNia } from "@/lib/nia";
import { isUniqueConstraintOn } from "@/lib/prisma-errors";
import {
  HAUL_OPTIONS,
  MENGINAP_OPTIONS,
  TAHLIL_AKBAR_OPTIONS,
  MAX_JUMLAH_ANAK,
  isValidAngkatan,
  isValidOptionValue,
} from "@/lib/types";

const TAHUN_ACARA = Number(process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026");

async function createNewAlumni(input: {
  namaLengkap: string;
  noWhatsapp: string;
  alamat: string | null;
  angkatanMasuk: number | null;
  angkatanLulus: number | null;
}) {
  // Race condition: dua registrasi baru nyaris bersamaan di angkatan yang sama
  // bisa menghitung NIA berikutnya yang sama persis. Coba sekali lagi dengan
  // NIA baru kalau itu yang terjadi, supaya tidak salah menolak dengan pesan
  // "nomor sudah terdaftar" padahal yang bentrok sebenarnya NIA-nya.
  for (let attempt = 0; attempt < 2; attempt++) {
    const nia = await generateNia(input.angkatanMasuk);
    try {
      return await prisma.alumni.create({
        data: { ...input, nia, source: "SELF_REGISTERED", dataVerifiedAt: new Date() },
      });
    } catch (err) {
      if (isUniqueConstraintOn(err, "nia") && attempt === 0) continue;
      throw err;
    }
  }
  throw new Error("Gagal generate NIA unik setelah beberapa percobaan.");
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const {
    alumniId,
    verifyNoWhatsapp,
    namaLengkap,
    noWhatsapp: rawPhone,
    alamat,
    angkatanMasuk,
    angkatanLulus,
    tahlilAkbar,
    haul,
    menginap,
    membawaPasangan,
    jumlahAnak,
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

  if (!isValidAngkatan(angkatanMasukNum) || !isValidAngkatan(angkatanLulusNum)) {
    return NextResponse.json({ error: "Angkatan masuk/lulus tidak valid." }, { status: 400 });
  }
  if (!isValidOptionValue(tahlilAkbar, TAHLIL_AKBAR_OPTIONS)) {
    return NextResponse.json({ error: "Nilai Tahlil Akbar tidak valid." }, { status: 400 });
  }
  if (!isValidOptionValue(haul, HAUL_OPTIONS)) {
    return NextResponse.json({ error: "Nilai Haul tidak valid." }, { status: 400 });
  }
  if (!isValidOptionValue(menginap, MENGINAP_OPTIONS)) {
    return NextResponse.json({ error: "Nilai Menginap tidak valid." }, { status: 400 });
  }

  const jumlahAnakRaw = Number(jumlahAnak);
  const jumlahAnakNum = Math.min(
    MAX_JUMLAH_ANAK,
    Math.max(0, Number.isFinite(jumlahAnakRaw) ? jumlahAnakRaw : 0),
  );
  const membawaPasanganBool = Boolean(membawaPasangan);

  let alumni;

  if (alumniId) {
    const existing = await prisma.alumni.findUnique({ where: { id: alumniId } });
    if (!existing) {
      return NextResponse.json({ error: "Data alumni tidak ditemukan." }, { status: 404 });
    }

    // Wajib buktikan tahu nomor HP yang sudah terdaftar sebelum boleh ubah data —
    // alumniId saja (walau UUID sulit ditebak) tidak cukup untuk otorisasi.
    const verifyNormalized =
      typeof verifyNoWhatsapp === "string" ? normalizeWhatsapp(verifyNoWhatsapp) : "";
    if (verifyNormalized !== existing.noWhatsapp) {
      return NextResponse.json(
        { error: "Verifikasi nomor HP tidak cocok. Silakan cari ulang dari halaman utama." },
        { status: 403 },
      );
    }

    const conflict = await prisma.alumni.findUnique({ where: { noWhatsapp } });
    if (conflict && conflict.id !== alumniId) {
      return NextResponse.json(
        { error: "Nomor WhatsApp sudah dipakai alumni lain. Hubungi sekretariat." },
        { status: 409 },
      );
    }

    try {
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
    } catch (err) {
      if (isUniqueConstraintOn(err, "noWhatsapp")) {
        return NextResponse.json(
          { error: "Nomor WhatsApp sudah dipakai alumni lain. Hubungi sekretariat." },
          { status: 409 },
        );
      }
      throw err;
    }
  } else {
    const conflict = await prisma.alumni.findUnique({ where: { noWhatsapp } });
    if (conflict) {
      return NextResponse.json(
        { error: "Nomor WhatsApp ini sudah terdaftar. Silakan cari ulang." },
        { status: 409 },
      );
    }

    try {
      alumni = await createNewAlumni({
        namaLengkap,
        noWhatsapp,
        alamat: alamat || null,
        angkatanMasuk: angkatanMasukNum,
        angkatanLulus: angkatanLulusNum,
      });
    } catch (err) {
      if (isUniqueConstraintOn(err, "noWhatsapp")) {
        return NextResponse.json(
          { error: "Nomor WhatsApp ini sudah terdaftar. Silakan cari ulang." },
          { status: 409 },
        );
      }
      throw err;
    }
  }

  const partisipasi = await prisma.partisipasiHaul.upsert({
    where: { alumniId_tahunAcara: { alumniId: alumni.id, tahunAcara: TAHUN_ACARA } },
    update: {
      tahlilAkbar,
      haul,
      menginap,
      membawaPasangan: membawaPasanganBool,
      jumlahAnak: jumlahAnakNum,
    },
    create: {
      alumniId: alumni.id,
      tahunAcara: TAHUN_ACARA,
      tahlilAkbar,
      haul,
      menginap,
      membawaPasangan: membawaPasanganBool,
      jumlahAnak: jumlahAnakNum,
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
      hasPinActive: Boolean(alumni.pinHash),
    },
    partisipasi: {
      tahunAcara: partisipasi.tahunAcara,
      tahlilAkbar: partisipasi.tahlilAkbar,
      haul: partisipasi.haul,
      menginap: partisipasi.menginap,
      membawaPasangan: partisipasi.membawaPasangan,
      jumlahAnak: partisipasi.jumlahAnak,
    },
  });
}
