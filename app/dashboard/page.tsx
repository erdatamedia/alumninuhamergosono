import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/session";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) redirect("/dashboard/login");

  const alumni = await prisma.alumni.findUnique({
    where: { id: session.alumniId },
    include: { partisipasi: { orderBy: { tahunAcara: "desc" } } },
  });
  if (!alumni) redirect("/dashboard/login");

  return (
    <DashboardClient
      alumni={{
        id: alumni.id,
        nia: alumni.nia,
        namaLengkap: alumni.namaLengkap,
        noWhatsapp: alumni.noWhatsapp,
        alamat: alumni.alamat,
        angkatanMasuk: alumni.angkatanMasuk,
        angkatanLulus: alumni.angkatanLulus,
      }}
      riwayat={alumni.partisipasi.map((p) => ({
        tahunAcara: p.tahunAcara,
        tahlilAkbar: p.tahlilAkbar,
        haul: p.haul,
        menginap: p.menginap,
        membawaPasangan: p.membawaPasangan,
        jumlahAnak: p.jumlahAnak,
      }))}
    />
  );
}
