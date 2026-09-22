import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, isValidAdminToken } from "@/lib/admin-auth";

const TAHUN_ACARA = Number(process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026");

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const angkatan = searchParams.get("angkatan");
  const statusKehadiran = searchParams.get("statusKehadiran");
  const statusVerifikasi = searchParams.get("statusVerifikasi");
  const q = searchParams.get("q")?.trim() ?? "";

  const where: Record<string, unknown> = {};
  if (angkatan) where.angkatanMasuk = Number(angkatan);
  if (statusVerifikasi === "verified") where.dataVerifiedAt = { not: null };
  if (statusVerifikasi === "unverified") where.dataVerifiedAt = null;
  if (q) {
    const digitsOnly = q.replace(/[^\d]/g, "");
    where.OR = [
      { namaLengkap: { contains: q } },
      { nia: { contains: q } },
      ...(digitsOnly.length >= 3 ? [{ noWhatsapp: { contains: digitsOnly } }] : []),
    ];
  }

  const alumniList = await prisma.alumni.findMany({
    where,
    include: { partisipasi: { where: { tahunAcara: TAHUN_ACARA } } },
    orderBy: { namaLengkap: "asc" },
  });

  let result = alumniList.map((a) => ({
    id: a.id,
    nia: a.nia,
    namaLengkap: a.namaLengkap,
    noWhatsapp: a.noWhatsapp,
    alamat: a.alamat,
    angkatanMasuk: a.angkatanMasuk,
    angkatanLulus: a.angkatanLulus,
    dataVerifiedAt: a.dataVerifiedAt,
    source: a.source,
    partisipasi: a.partisipasi[0] ?? null,
  }));

  if (statusKehadiran) {
    result = result.filter((a) => a.partisipasi?.haul === statusKehadiran);
  }

  return NextResponse.json({ alumni: result, tahunAcara: TAHUN_ACARA });
}
