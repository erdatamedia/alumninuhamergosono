import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, isValidAdminToken } from "@/lib/admin-auth";

const TAHUN_ACARA = Number(process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026");

// Reset sesi check-in: kosongkan checkedInAt tahun berjalan. Dipisah dari
// reset undian supaya keduanya bisa di-reset independen saat uji coba —
// mis. reset check-in tanpa ikut menghapus catatan pemenang doorprize.
export async function POST() {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const result = await prisma.partisipasiHaul.updateMany({
    where: { tahunAcara: TAHUN_ACARA, checkedInAt: { not: null } },
    data: { checkedInAt: null },
  });

  return NextResponse.json({ ok: true, count: result.count });
}
