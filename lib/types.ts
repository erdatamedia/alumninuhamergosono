export type AlumniData = {
  id?: string;
  nia?: string;
  namaLengkap: string;
  noWhatsapp: string;
  alamat: string;
  angkatanMasuk: string;
  angkatanLulus: string;
  dataVerifiedAt?: string | null;
};

export type PartisipasiData = {
  tahlilAkbar: string;
  haul: string;
  menginap: string;
  membawaPasangan: boolean;
  jumlahAnak: string;
};

export const TAHLIL_AKBAR_OPTIONS = ["Hadir", "Tidak"];
export const HAUL_OPTIONS = ["Hadir Luring", "Hadir Daring/Live Streaming", "Tidak Hadir"];
export const MENGINAP_OPTIONS = [
  "Menginap di Pondok Nurul Huda Mergosono",
  "Menginap di luar Pondok Nurul Huda Mergosono",
  "Tidak menginap",
];

/** "" dianggap valid (artinya belum diisi/dipilih), selain itu harus persis cocok salah satu opsi. */
export function isValidOptionValue(value: unknown, options: string[]): boolean {
  return typeof value === "string" && (value === "" || options.includes(value));
}

export const MIN_ANGKATAN = 1950;
export const MAX_ANGKATAN = new Date().getFullYear() + 1;
export const MAX_JUMLAH_ANAK = 20;

export function isValidAngkatan(value: number | null): boolean {
  if (value === null) return true;
  return Number.isInteger(value) && value >= MIN_ANGKATAN && value <= MAX_ANGKATAN;
}
