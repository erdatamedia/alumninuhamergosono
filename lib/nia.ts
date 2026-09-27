import { prisma } from "@/lib/prisma";

/**
 * Generate NIA baru untuk alumni yang daftar sendiri (SELF_REGISTERED).
 *
 * `offset` dipakai pemanggil untuk menghasilkan kandidat nomor urut yang
 * berbeda saat retry akibat tabrakan (lihat createNewAlumni di
 * app/api/alumni/confirm/route.ts) — banyak request bersamaan bisa
 * menghitung count() yang sama sebelum salah satu commit, jadi retry yang
 * hanya mengulang count() tanpa offset akan menghasilkan NIA yang sama lagi.
 */
export async function generateNia(
  angkatanMasuk: number | null,
  offset = 0,
): Promise<string> {
  const angkatanKey = angkatanMasuk ? String(angkatanMasuk) : "XX";
  const count = await prisma.alumni.count({
    where: { nia: { startsWith: `NHM-${angkatanKey}-` } },
  });
  const urutan = String(count + 1 + offset).padStart(4, "0");
  return `NHM-${angkatanKey}-${urutan}`;
}
