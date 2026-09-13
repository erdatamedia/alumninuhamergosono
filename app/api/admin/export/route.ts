import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE_NAME, isValidAdminToken } from "@/lib/admin-auth";

const TAHUN_ACARA = Number(process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026");

export async function GET() {
  const cookieStore = await cookies();
  if (!isValidAdminToken(cookieStore.get(ADMIN_COOKIE_NAME)?.value)) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  const alumniList = await prisma.alumni.findMany({
    include: { partisipasi: { where: { tahunAcara: TAHUN_ACARA } } },
    orderBy: { namaLengkap: "asc" },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`Alumni Haul ${TAHUN_ACARA}`);

  sheet.columns = [
    { header: "NIA", key: "nia", width: 18 },
    { header: "Nama Lengkap", key: "namaLengkap", width: 28 },
    { header: "No. WhatsApp", key: "noWhatsapp", width: 18 },
    { header: "Alamat", key: "alamat", width: 32 },
    { header: "Angkatan Masuk", key: "angkatanMasuk", width: 14 },
    { header: "Angkatan Lulus", key: "angkatanLulus", width: 14 },
    { header: "Status Verifikasi", key: "statusVerifikasi", width: 16 },
    { header: "Tahlil Akbar", key: "tahlilAkbar", width: 14 },
    { header: "Haul", key: "haul", width: 24 },
    { header: "Menginap", key: "menginap", width: 16 },
    { header: "Sumber Data", key: "source", width: 18 },
  ];
  sheet.getRow(1).font = { bold: true };

  for (const a of alumniList) {
    const p = a.partisipasi[0];
    sheet.addRow({
      nia: a.nia,
      namaLengkap: a.namaLengkap,
      noWhatsapp: a.noWhatsapp,
      alamat: a.alamat ?? "",
      angkatanMasuk: a.angkatanMasuk ?? "",
      angkatanLulus: a.angkatanLulus ?? "",
      statusVerifikasi: a.dataVerifiedAt ? "Terverifikasi" : "Belum diverifikasi",
      tahlilAkbar: p?.tahlilAkbar ?? "",
      haul: p?.haul ?? "",
      menginap: p?.menginap ?? "",
      source: a.source,
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="alumni-haul-${TAHUN_ACARA}.xlsx"`,
    },
  });
}
