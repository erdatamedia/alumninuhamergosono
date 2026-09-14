import Wizard from "./components/Wizard";
import { prisma } from "@/lib/prisma";

// Hitung ulang tiap request — kalau di-prerender statis, angka akan beku
// di nilai saat build terakhir, bukan jumlah alumni terverifikasi saat ini.
export const dynamic = "force-dynamic";

export default async function Home() {
  const verifiedCount = await prisma.alumni.count({
    where: { dataVerifiedAt: { not: null } },
  });

  return (
    <main className="flex flex-1 flex-col">
      <Wizard verifiedCount={verifiedCount} />
    </main>
  );
}
