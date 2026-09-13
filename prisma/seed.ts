import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const SEED_FILE = path.join(__dirname, "alumni_seed_final.json");
const TAHUN_ACARA = Number(process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026");

type PartisipasiHaulSeed = {
  tahlilAkbar?: string | null;
  haul?: string | null;
  menginap?: string | null;
};

type AlumniSeed = {
  namaLengkap: string;
  noWhatsapp: string;
  alamat?: string | null;
  angkatanMasuk?: number | null;
  angkatanLulus?: number | null;
  partisipasiHaul2026?: PartisipasiHaulSeed | null;
};

function normalizeWhatsapp(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  if (digits.startsWith("62")) return digits;
  return digits;
}

async function main() {
  if (!fs.existsSync(SEED_FILE)) {
    console.error(
      `File seed tidak ditemukan: ${SEED_FILE}\n` +
        `Taruh alumni_seed_final.json di folder prisma/ lalu jalankan ulang seed.`,
    );
    process.exit(1);
  }

  const raw = fs.readFileSync(SEED_FILE, "utf-8");
  const entries: AlumniSeed[] = JSON.parse(raw);

  // Nomor urut per angkatanMasuk, untuk generate NIA yang stabil dan berurutan.
  const urutanPerAngkatan = new Map<string, number>();
  let dibuat = 0;
  let dilewati = 0;

  for (const entry of entries) {
    if (!entry.noWhatsapp || !entry.noWhatsapp.trim()) {
      console.warn(`Lewati "${entry.namaLengkap}": nomor WhatsApp kosong.`);
      dilewati++;
      continue;
    }

    const noWhatsapp = normalizeWhatsapp(entry.noWhatsapp);
    const angkatanKey = entry.angkatanMasuk ? String(entry.angkatanMasuk) : "XX";
    const urutan = (urutanPerAngkatan.get(angkatanKey) ?? 0) + 1;
    urutanPerAngkatan.set(angkatanKey, urutan);
    const nia = `NHM-${angkatanKey}-${String(urutan).padStart(4, "0")}`;

    const existing = await prisma.alumni.findUnique({ where: { noWhatsapp } });
    if (existing) {
      console.warn(
        `Lewati "${entry.namaLengkap}": nomor WhatsApp ${noWhatsapp} sudah dipakai alumni lain (duplikat di data sumber).`,
      );
      dilewati++;
      continue;
    }

    const alumni = await prisma.alumni.create({
      data: {
        nia,
        namaLengkap: entry.namaLengkap,
        noWhatsapp,
        alamat: entry.alamat ?? null,
        angkatanMasuk: entry.angkatanMasuk ?? null,
        angkatanLulus: entry.angkatanLulus ?? null,
        source: "MIGRATED_HISTORICAL",
        dataVerifiedAt: null,
      },
    });

    if (entry.partisipasiHaul2026) {
      await prisma.partisipasiHaul.create({
        data: {
          alumniId: alumni.id,
          tahunAcara: TAHUN_ACARA,
          tahlilAkbar: entry.partisipasiHaul2026.tahlilAkbar ?? null,
          haul: entry.partisipasiHaul2026.haul ?? null,
          menginap: entry.partisipasiHaul2026.menginap ?? null,
        },
      });
    }

    dibuat++;
  }

  console.log(`Selesai. ${dibuat} alumni dibuat, ${dilewati} dilewati (perlu review manual).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
