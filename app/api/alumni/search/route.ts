import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeWhatsapp, isValidWhatsapp } from "@/lib/phone";
import { checkRateLimit, getClientIp, formatRetryAfter } from "@/lib/rate-limit";

const TAHUN_ACARA = Number(process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026");

const MAX_ATTEMPT = 10;
const WINDOW_MS = 60 * 1000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rate = checkRateLimit(`alumni-search:${ip}`, MAX_ATTEMPT, WINDOW_MS);
  if (!rate.allowed) {
    return NextResponse.json(
      {
        error: `Terlalu banyak percobaan pencarian. Coba lagi ${formatRetryAfter(rate.retryAfterMs)}.`,
      },
      { status: 429 },
    );
  }

  const body = await req.json().catch(() => null);
  const rawPhone = body?.noWhatsapp;

  if (typeof rawPhone !== "string" || !rawPhone.trim()) {
    return NextResponse.json({ error: "Nomor WhatsApp wajib diisi." }, { status: 400 });
  }

  const noWhatsapp = normalizeWhatsapp(rawPhone);
  if (!isValidWhatsapp(noWhatsapp)) {
    return NextResponse.json({ error: "Format nomor WhatsApp tidak valid." }, { status: 400 });
  }

  const alumni = await prisma.alumni.findUnique({
    where: { noWhatsapp },
    include: {
      partisipasi: { where: { tahunAcara: TAHUN_ACARA } },
    },
  });

  if (!alumni) {
    return NextResponse.json({ found: false, noWhatsapp });
  }

  return NextResponse.json({
    found: true,
    alumni: {
      id: alumni.id,
      nia: alumni.nia,
      namaLengkap: alumni.namaLengkap,
      noWhatsapp: alumni.noWhatsapp,
      alamat: alumni.alamat,
      angkatanMasuk: alumni.angkatanMasuk,
      angkatanLulus: alumni.angkatanLulus,
      dataVerifiedAt: alumni.dataVerifiedAt,
      hasPinActive: Boolean(alumni.pinHash),
    },
    partisipasi: alumni.partisipasi[0]
      ? {
          tahlilAkbar: alumni.partisipasi[0].tahlilAkbar,
          haul: alumni.partisipasi[0].haul,
          menginap: alumni.partisipasi[0].menginap,
          membawaPasangan: alumni.partisipasi[0].membawaPasangan,
          jumlahAnak: alumni.partisipasi[0].jumlahAnak,
        }
      : null,
  });
}
