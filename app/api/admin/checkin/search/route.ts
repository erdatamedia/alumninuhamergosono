import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, isValidAdminToken } from "@/lib/admin-auth";

const TAHUN_ACARA = Number(process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026");

// Cari manual by nama atau nomor HP — untuk alumni yang belum aktifkan
// dashboard/kartu digital, atau HP-nya bermasalah saat di lokasi.
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ alumni: [] });
  }

  const digitsOnly = q.replace(/[^\d]/g, "");

  const results = await prisma.alumni.findMany({
    where: {
      OR: [
        { namaLengkap: { contains: q } },
        ...(digitsOnly.length >= 3 ? [{ noWhatsapp: { contains: digitsOnly } }] : []),
      ],
    },
    include: { partisipasi: { where: { tahunAcara: TAHUN_ACARA } } },
    orderBy: { namaLengkap: "asc" },
    take: 20,
  });

  return NextResponse.json({
    alumni: results.map((a) => ({
      id: a.id,
      nia: a.nia,
      namaLengkap: a.namaLengkap,
      noWhatsapp: a.noWhatsapp,
      angkatanMasuk: a.angkatanMasuk,
      angkatanLulus: a.angkatanLulus,
      fotoUrl: a.fotoUrl,
      checkedInAt: a.partisipasi[0]?.checkedInAt ?? null,
    })),
  });
}
