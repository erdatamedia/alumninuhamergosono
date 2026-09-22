import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, isValidAdminToken } from "@/lib/admin-auth";

const TAHUN_ACARA = Number(process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026");

export async function GET() {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const winners = await prisma.doorprizeWinner.findMany({
    where: { tahunAcara: TAHUN_ACARA },
    include: { alumni: { select: { namaLengkap: true, nia: true, fotoUrl: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    winners: winners.map((w) => ({
      id: w.id,
      namaLengkap: w.alumni.namaLengkap,
      nia: w.alumni.nia,
      fotoUrl: w.alumni.fotoUrl,
      namaHadiah: w.namaHadiah,
      createdAt: w.createdAt,
    })),
  });
}
