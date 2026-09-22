import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import EventInfoCard from "@/app/components/EventInfoCard";

const TAHUN_ACARA = process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026";

// Hitung ulang tiap request — sama seperti counter di homepage, supaya
// angka yang ditampilkan ke calon pengisi selalu mencerminkan data terkini.
export const dynamic = "force-dynamic";

export default async function InfoPage() {
  const [totalVerified, totalKonfirmasi] = await Promise.all([
    prisma.alumni.count({ where: { dataVerifiedAt: { not: null } } }),
    prisma.partisipasiHaul.count({ where: { tahunAcara: Number(TAHUN_ACARA) } }),
  ]);

  return (
    <main className="flex flex-1 flex-col pb-24">
      <div className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
        <header className="mb-6 text-center">
          <div className="mx-auto mb-3 h-16 w-16 overflow-hidden rounded-full shadow-lg ring-2 ring-white/70">
            <Image
              src="/logo.png"
              alt="Logo Pondok Pesantren Nurul Huda"
              width={64}
              height={64}
              className="h-full w-full object-cover"
              priority
            />
          </div>
          <h1 className="text-xl font-semibold text-gray-900">Info Acara Haul</h1>
          <p className="mt-1 text-sm text-gray-600">
            Rincian acara & data partisipasi yang sudah terverifikasi via sistem.
          </p>
        </header>

        <div className="glass-card mb-4 grid grid-cols-2 gap-3 rounded-[28px] p-6 text-center">
          <div>
            <p className="text-2xl font-bold text-green-800">
              {totalVerified.toLocaleString("id-ID")}
            </p>
            <p className="mt-1 text-xs text-gray-600">Alumni terverifikasi</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-800">
              {totalKonfirmasi.toLocaleString("id-ID")}
            </p>
            <p className="mt-1 text-xs text-gray-600">Konfirmasi Haul {TAHUN_ACARA}</p>
          </div>
        </div>

        <EventInfoCard />

        <Link
          href="/"
          className="glass-button-primary mt-4 block w-full rounded-full py-3 text-center text-base font-medium text-white transition active:scale-[0.98]"
        >
          Cari & Konfirmasi Data Saya
        </Link>
      </div>
    </main>
  );
}
