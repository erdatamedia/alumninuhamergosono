/**
 * Normalisasi nomor HP/WhatsApp: 08xx -> 62xx, 62xx tetap, nomor luar negeri (mis. +61...)
 * disimpan apa adanya sebagai digit tanpa paksa tambah 62. Harus sinkron dengan prisma/seed.ts.
 */
export function normalizeWhatsapp(raw: string): string {
  const digits = raw.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return digits;
}

export function isValidWhatsapp(normalized: string): boolean {
  return /^\d{8,15}$/.test(normalized);
}
