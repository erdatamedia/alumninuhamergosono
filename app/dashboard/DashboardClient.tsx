"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import AlumniProfileForm from "@/app/components/AlumniProfileForm";
import { AlumniData } from "@/lib/types";

type AlumniProfile = {
  id: string;
  nia: string;
  namaLengkap: string;
  noWhatsapp: string;
  alamat: string | null;
  angkatanMasuk: number | null;
  angkatanLulus: number | null;
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
