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
export const MENGINAP_OPTIONS = ["Menginap", "Tidak menginap"];
