import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, isValidAdminToken } from "@/lib/admin-auth";

const TAHUN_ACARA = Number(process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026");

// Lookup by alumniId — dipakai setelah QR di-scan (payload QR = alumni.id).
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const alumniId = req.nextUrl.searchParams.get("alumniId");
  if (!alumniId) {
    return NextResponse.json({ error: "QR tidak valid." }, { status: 400 });
  }

  const alumni = await prisma.alumni.findUnique({
    where: { id: alumniId },
    include: { partisipasi: { where: { tahunAcara: TAHUN_ACARA } } },
  });

  if (!alumni) {
    return NextResponse.json({ error: "Data alumni tidak ditemukan untuk QR ini." }, { status: 404 });
  }

  return NextResponse.json({
    alumni: {
      id: alumni.id,
      nia: alumni.nia,
      namaLengkap: alumni.namaLengkap,
      noWhatsapp: alumni.noWhatsapp,
      angkatanMasuk: alumni.angkatanMasuk,
      angkatanLulus: alumni.angkatanLulus,
      fotoUrl: alumni.fotoUrl,
    },
    checkedInAt: alumni.partisipasi[0]?.checkedInAt ?? null,
  });
}
