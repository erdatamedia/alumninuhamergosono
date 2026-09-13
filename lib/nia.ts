import { prisma } from "@/lib/prisma";

/** Generate NIA baru untuk alumni yang daftar sendiri (SELF_REGISTERED). */
export async function generateNia(angkatanMasuk: number | null): Promise<string> {
  const angkatanKey = angkatanMasuk ? String(angkatanMasuk) : "XX";
  const count = await prisma.alumni.count({
    where: { nia: { startsWith: `NHM-${angkatanKey}-` } },
  });
  const urutan = String(count + 1).padStart(4, "0");
  return `NHM-${angkatanKey}-${urutan}`;
}
