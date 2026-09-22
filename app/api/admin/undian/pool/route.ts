import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, isValidAdminToken } from "@/lib/admin-auth";

const TAHUN_ACARA = Number(process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026");

// Pool undian: alumni yang sudah check-in tahun ini, dikurangi yang sudah
// pernah menang di tahun yang sama (supaya tidak menang dobel).
export async function GET() {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const winners = await prisma.doorprizeWinner.findMany({
    where: { tahunAcara: TAHUN_ACARA },
    select: { alumniId: true },
  });
  const winnerIds = winners.map((w) => w.alumniId);

  const checkedIn = await prisma.partisipasiHaul.findMany({
    where: {
      tahunAcara: TAHUN_ACARA,
      checkedInAt: { not: null },
      ...(winnerIds.length > 0 ? { alumniId: { notIn: winnerIds } } : {}),
    },
    include: {
      alumni: { select: { id: true, namaLengkap: true, nia: true, fotoUrl: true } },
    },
    orderBy: { checkedInAt: "asc" },
  });

  return NextResponse.json({
    pool: checkedIn.map((p) => ({
      id: p.alumni.id,
      namaLengkap: p.alumni.namaLengkap,
      nia: p.alumni.nia,
      fotoUrl: p.alumni.fotoUrl,
    })),
  });
}
