import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, isValidAdminToken } from "@/lib/admin-auth";
import { isUniqueConstraintOn } from "@/lib/prisma-errors";

const TAHUN_ACARA = Number(process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026");

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const alumniId = body?.alumniId;
  const namaHadiah = body?.namaHadiah;

  if (typeof alumniId !== "string" || !alumniId) {
    return NextResponse.json({ error: "Data alumni tidak valid." }, { status: 400 });
  }
  if (namaHadiah !== undefined && namaHadiah !== null && typeof namaHadiah !== "string") {
    return NextResponse.json({ error: "Nama hadiah tidak valid." }, { status: 400 });
  }

  const partisipasi = await prisma.partisipasiHaul.findUnique({
    where: { alumniId_tahunAcara: { alumniId, tahunAcara: TAHUN_ACARA } },
  });
  if (!partisipasi?.checkedInAt) {
    return NextResponse.json(
      { error: "Alumni ini belum tercatat check-in tahun ini." },
      { status: 400 },
    );
  }

  const alreadyWon = await prisma.doorprizeWinner.findFirst({
    where: { alumniId, tahunAcara: TAHUN_ACARA },
  });
  if (alreadyWon) {
    return NextResponse.json(
      { error: "Alumni ini sudah pernah menang doorprize tahun ini." },
      { status: 409 },
    );
  }

  let winner;
  try {
    winner = await prisma.doorprizeWinner.create({
      data: {
        alumniId,
        tahunAcara: TAHUN_ACARA,
        namaHadiah: namaHadiah?.trim() || null,
      },
      include: { alumni: { select: { namaLengkap: true, nia: true, fotoUrl: true } } },
    });
  } catch (err) {
    if (isUniqueConstraintOn(err, "alumniId")) {
      return NextResponse.json(
        { error: "Alumni ini sudah pernah menang doorprize tahun ini." },
        { status: 409 },
      );
    }
    throw err;
  }

  return NextResponse.json({
    winner: {
      id: winner.id,
      namaLengkap: winner.alumni.namaLengkap,
      nia: winner.alumni.nia,
      fotoUrl: winner.alumni.fotoUrl,
      namaHadiah: winner.namaHadiah,
      createdAt: winner.createdAt,
    },
  });
}

// Batalkan satu catatan pemenang — dipakai saat orangnya ternyata tidak ada
// di lokasi (mis. check-in ditandai manual tanpa verifikasi fisik penuh),
// supaya hadiahnya bisa diundi ulang tanpa harus reset seluruh sesi undian.
export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const winnerId = body?.winnerId;
  if (typeof winnerId !== "string" || !winnerId) {
    return NextResponse.json({ error: "ID pemenang tidak valid." }, { status: 400 });
  }

  const winner = await prisma.doorprizeWinner.findUnique({ where: { id: winnerId } });
  if (!winner || winner.tahunAcara !== TAHUN_ACARA) {
    return NextResponse.json({ error: "Catatan pemenang tidak ditemukan." }, { status: 404 });
  }

  await prisma.doorprizeWinner.delete({ where: { id: winnerId } });
  return NextResponse.json({ ok: true });
}
