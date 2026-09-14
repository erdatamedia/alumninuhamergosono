"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import AlumniProfileForm from "@/app/components/AlumniProfileForm";
import { AlumniData } from "@/lib/types";
import AlumniCard from "./AlumniCard";

type AlumniProfile = {
  id: string;
  nia: string;
  namaLengkap: string;
  noWhatsapp: string;
  alamat: string | null;
  angkatanMasuk: number | null;
  angkatanLulus: number | null;
  fotoUrl: string | null;
};

type RiwayatItem = {
  tahunAcara: number;
  tahlilAkbar: string | null;
  haul: string | null;
  menginap: string | null;
  membawaPasangan: boolean;
  jumlahAnak: number;
};

export default function DashboardClient({
  alumni: initialAlumni,
  riwayat,
}: {
  alumni: AlumniProfile;
  riwayat: RiwayatItem[];
}) {
  const router = useRouter();
  const [alumni, setAlumni] = useState(initialAlumni);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState<AlumniData>(toFormData(initialAlumni));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  function toFormData(a: AlumniProfile): AlumniData {
    return {
      id: a.id,
      nia: a.nia,
      namaLengkap: a.namaLengkap,
      noWhatsapp: a.noWhatsapp,
      alamat: a.alamat ?? "",
      angkatanMasuk: a.angkatanMasuk?.toString() ?? "",
      angkatanLulus: a.angkatanLulus?.toString() ?? "",
    };
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/dashboard/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaLengkap: formData.namaLengkap,
          noWhatsapp: formData.noWhatsapp,
          alamat: formData.alamat,
          angkatanMasuk: formData.angkatanMasuk,
          angkatanLulus: formData.angkatanLulus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan perubahan.");
        setSaving(false);
        return;
      }
      const updated: AlumniProfile = { ...alumni, ...data.alumni };
      setAlumni(updated);
      setFormData(toFormData(updated));
      setEditing(false);
    } catch {
      setError("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/dashboard/logout", { method: "POST" });
    router.push("/dashboard/login");
    router.refresh();
  }

  return (
    <main className="flex flex-1 flex-col px-4 py-8">
      <div className="mx-auto w-full max-w-md">
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-white/70">
              <Image
                src="/logo.png"
                alt="Logo Pondok Pesantren Nurul Huda"
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Dashboard Alumni</h1>
              <p className="text-xs text-gray-600">{alumni.nia}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="glass-button-secondary shrink-0 rounded-full px-4 py-2 text-xs font-medium text-gray-700 transition active:scale-95 disabled:opacity-60"
          >
            {loggingOut ? "..." : "Keluar"}
          </button>
        </header>

        <KartuAlumniSection alumni={alumni} onFotoUpdated={(fotoUrl) => setAlumni((a) => ({ ...a, fotoUrl }))} />

        <AnimatePresence mode="wait" initial={false}>
          {editing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
              <AlumniProfileForm
                alumni={formData}
                setAlumni={setFormData}
                title="Edit Data Alumni"
                description="Perbarui data Anda, lalu simpan."
                submitLabel={saving ? "Menyimpan..." : "Simpan Perubahan"}
                cancelLabel="Batal"
                onSubmit={handleSave}
                onCancel={() => {
                  setEditing(false);
                  setError(null);
                  setFormData(toFormData(alumni));
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <div className="glass-card rounded-[28px] p-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-gray-900">Profil Saya</h2>
                  <button
                    onClick={() => setEditing(true)}
                    className="glass-button-secondary rounded-full px-4 py-1.5 text-xs font-medium text-gray-700 transition active:scale-95"
                  >
                    Edit Data
                  </button>
                </div>
                <div className="glass-input mt-4 space-y-2 rounded-2xl p-4 text-sm">
                  <Row label="Nama" value={alumni.namaLengkap} />
                  <Row label="No. WhatsApp" value={alumni.noWhatsapp} />
                  <Row label="Alamat" value={alumni.alamat || "-"} />
                  <Row
                    label="Angkatan"
                    value={`${alumni.angkatanMasuk ?? "-"} / ${alumni.angkatanLulus ?? "-"}`}
                  />
                </div>
              </div>

              <div className="glass-card rounded-[28px] p-6">
                <h2 className="text-base font-semibold text-gray-900">Riwayat Kehadiran</h2>
                {riwayat.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-600">
                    Belum ada riwayat konfirmasi kehadiran.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {riwayat.map((r) => (
                      <div key={r.tahunAcara} className="glass-input rounded-2xl p-4 text-sm">
                        <p className="font-semibold text-gray-900">Haul {r.tahunAcara}</p>
                        <div className="mt-2 space-y-1">
                          <Row label="Tahlil Akbar" value={r.tahlilAkbar || "-"} />
                          <Row label="Haul" value={r.haul || "-"} />
                          <Row label="Menginap" value={r.menginap || "-"} />
                          <Row label="Pasangan" value={r.membawaPasangan ? "Ya" : "Tidak"} />
                          <Row label="Jumlah Anak" value={String(r.jumlahAnak)} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-600">{label}</span>
      <span className="text-right font-medium text-gray-900">{value}</span>
    </div>
  );
}

const MAX_FOTO_SIZE = 2 * 1024 * 1024;
const ALLOWED_FOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

function KartuAlumniSection({
  alumni,
  onFotoUpdated,
}: {
  alumni: AlumniProfile;
  onFotoUpdated: (fotoUrl: string) => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_FOTO_TYPES.includes(file.type)) {
      setUploadError("Format file harus JPEG, PNG, atau WebP.");
      return;
    }
    if (file.size > MAX_FOTO_SIZE) {
      setUploadError("Ukuran file maksimal 2MB.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  async function handleUpload() {
    if (!selectedFile) return;
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("foto", selectedFile);
      const res = await fetch("/api/dashboard/upload-foto", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error ?? "Gagal mengunggah foto.");
        setUploading(false);
        return;
      }
      onFotoUpdated(data.fotoUrl);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch {
      setUploadError("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload() {
    if (!cardRef.current) return;
    setDownloadError(null);
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `kartu-alumni-${alumni.nia}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      setDownloadError("Gagal membuat gambar kartu. Coba lagi.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="glass-card mb-4 rounded-[28px] p-6">
      <h2 className="text-base font-semibold text-gray-900">Kartu Alumni Digital</h2>
      <p className="mt-1 text-sm text-gray-600">
        Kartu ini hanya bisa dilihat oleh Anda sendiri lewat dashboard ini.
      </p>

      <div className="mt-4">
        <AlumniCard
          ref={cardRef}
          namaLengkap={alumni.namaLengkap}
          nia={alumni.nia}
          angkatanMasuk={alumni.angkatanMasuk}
          angkatanLulus={alumni.angkatanLulus}
          fotoUrl={previewUrl ?? alumni.fotoUrl}
        />
      </div>

      {downloadError && <p className="mt-3 text-sm text-red-600">{downloadError}</p>}

      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="glass-button-primary mt-4 w-full rounded-full py-3 text-sm font-medium text-white transition active:scale-[0.97] disabled:opacity-60"
      >
        {downloading ? "Menyiapkan gambar..." : "Download Kartu sebagai Gambar"}
      </button>

      <div className="glass-input mt-4 rounded-2xl p-4">
        <p className="text-sm font-medium text-gray-700">
          {alumni.fotoUrl ? "Ganti Foto Profil" : "Upload Foto Profil untuk Kartu Alumni"}
        </p>
        <p className="mt-1 text-xs text-gray-500">
          JPEG/PNG/WebP, maksimal 2MB. Foto akan dipotong persegi otomatis.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="glass-button-secondary rounded-full px-4 py-2 text-xs font-medium text-gray-700 transition active:scale-95"
          >
            Pilih Foto
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          {selectedFile && (
            <button
              type="button"
              onClick={handleUpload}
              disabled={uploading}
              className="glass-button-primary rounded-full px-4 py-2 text-xs font-medium text-white transition active:scale-95 disabled:opacity-60"
            >
              {uploading ? "Mengunggah..." : "Simpan Foto"}
            </button>
          )}
        </div>

        {uploadError && <p className="mt-2 text-sm text-red-600">{uploadError}</p>}
      </div>
    </div>
  );
}
