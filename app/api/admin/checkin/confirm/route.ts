import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, isValidAdminToken } from "@/lib/admin-auth";

const TAHUN_ACARA = Number(process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026");

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const alumniId = body?.alumniId;
  if (typeof alumniId !== "string" || !alumniId) {
    return NextResponse.json({ error: "Data alumni tidak valid." }, { status: 400 });
  }

  const alumni = await prisma.alumni.findUnique({ where: { id: alumniId } });
  if (!alumni) {
    return NextResponse.json({ error: "Data alumni tidak ditemukan." }, { status: 404 });
  }

  const existing = await prisma.partisipasiHaul.findUnique({
    where: { alumniId_tahunAcara: { alumniId, tahunAcara: TAHUN_ACARA } },
  });

  // Idempoten: kalau sudah pernah check-in, jangan timpa waktunya — ini
  // kondisi normal (mis. scan ulang tidak sengaja), bukan error.
  if (existing?.checkedInAt) {
    return NextResponse.json({ checkedInAt: existing.checkedInAt, alreadyCheckedIn: true });
  }

  const partisipasi = existing
    ? await prisma.partisipasiHaul.update({
        where: { alumniId_tahunAcara: { alumniId, tahunAcara: TAHUN_ACARA } },
        data: { checkedInAt: new Date() },
      })
    : await prisma.partisipasiHaul.create({
        data: { alumniId, tahunAcara: TAHUN_ACARA, checkedInAt: new Date() },
      });

  return NextResponse.json({ checkedInAt: partisipasi.checkedInAt, alreadyCheckedIn: false });
}
