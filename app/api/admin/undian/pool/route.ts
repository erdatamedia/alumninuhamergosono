import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, isValidAdminToken } from "@/lib/admin-auth";

const TAHUN_ACARA = Number(process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026");

// Pool undian: alumni yang sudah presensi lewat sesi QR khusus undian
// (DoorprizeSession/Entry) terbaru — bukan PartisipasiHaul.checkedInAt umum,
// karena check-in umum terbukti bisa ditandai manual tanpa verifikasi fisik
// penuh. Dikurangi yang sudah pernah menang di tahun yang sama.
export async function GET() {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const session = await prisma.doorprizeSession.findFirst({
    where: { tahunAcara: TAHUN_ACARA },
    orderBy: { createdAt: "desc" },
  });
  if (!session) {
    return NextResponse.json({ pool: [] });
  }

  const winners = await prisma.doorprizeWinner.findMany({
    where: { tahunAcara: TAHUN_ACARA },
    select: { alumniId: true },
  });
  const winnerIds = winners.map((w) => w.alumniId);

  const entries = await prisma.doorprizeEntry.findMany({
    where: {
      sessionId: session.id,
      ...(winnerIds.length > 0 ? { alumniId: { notIn: winnerIds } } : {}),
    },
    include: {
      alumni: { select: { id: true, namaLengkap: true, nia: true, fotoUrl: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({
    pool: entries.map((e) => ({
      id: e.alumni.id,
      namaLengkap: e.alumni.namaLengkap,
      nia: e.alumni.nia,
      fotoUrl: e.alumni.fotoUrl,
    })),
  });
}
