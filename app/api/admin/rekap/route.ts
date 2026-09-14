import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, isValidAdminToken } from "@/lib/admin-auth";

const TAHUN_ACARA = Number(process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026");

type Breakdown = { label: string; count: number };

function toBreakdown(entries: { label: string | null; count: number }[]): Breakdown[] {
  return entries
    .map((e) => ({ label: e.label ?? "Belum diisi", count: e.count }))
    .sort((a, b) => b.count - a.count);
}

export async function GET() {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const [
    totalVerified,
    totalKonfirmasi,
    tahlilAkbarGroups,
    haulGroups,
    menginapGroups,
    totalPasangan,
    anakAggregate,
  ] = await Promise.all([
    prisma.alumni.count({ where: { dataVerifiedAt: { not: null } } }),
    prisma.partisipasiHaul.count({ where: { tahunAcara: TAHUN_ACARA } }),
    prisma.partisipasiHaul.groupBy({
      by: ["tahlilAkbar"],
      where: { tahunAcara: TAHUN_ACARA },
      _count: { _all: true },
    }),
    prisma.partisipasiHaul.groupBy({
      by: ["haul"],
      where: { tahunAcara: TAHUN_ACARA },
      _count: { _all: true },
    }),
    prisma.partisipasiHaul.groupBy({
      by: ["menginap"],
      where: { tahunAcara: TAHUN_ACARA },
      _count: { _all: true },
    }),
    prisma.partisipasiHaul.count({
      where: { tahunAcara: TAHUN_ACARA, membawaPasangan: true },
    }),
    prisma.partisipasiHaul.aggregate({
      where: { tahunAcara: TAHUN_ACARA },
      _sum: { jumlahAnak: true },
    }),
  ]);

  return NextResponse.json({
    tahunAcara: TAHUN_ACARA,
    totalVerified,
    totalKonfirmasi,
    tahlilAkbar: toBreakdown(
      tahlilAkbarGroups.map((g) => ({ label: g.tahlilAkbar, count: g._count._all })),
    ),
    haul: toBreakdown(haulGroups.map((g) => ({ label: g.haul, count: g._count._all }))),
    menginap: toBreakdown(
      menginapGroups.map((g) => ({ label: g.menginap, count: g._count._all })),
    ),
    totalPasangan,
    totalAnak: anakAggregate._sum.jumlahAnak ?? 0,
    generatedAt: new Date().toISOString(),
  });
}
