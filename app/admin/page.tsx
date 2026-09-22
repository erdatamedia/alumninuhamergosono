"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import RekapCard, { RekapData } from "./RekapCard";
import AdminGate from "./AdminGate";
import AlumniProfileForm from "@/app/components/AlumniProfileForm";
import { AlumniData } from "@/lib/types";

type AlumniRow = {
  id: string;
  nia: string;
  namaLengkap: string;
  noWhatsapp: string;
  alamat: string | null;
  angkatanMasuk: number | null;
  angkatanLulus: number | null;
  dataVerifiedAt: string | null;
  source: string;
  partisipasi: {
    tahlilAkbar: string | null;
    haul: string | null;
    menginap: string | null;
    membawaPasangan: boolean;
    jumlahAnak: number;
  } | null;
};

function toFormData(a: AlumniRow): AlumniData {
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

export default function AdminPage() {
  return (
    <AdminGate title="Data Alumni" active="alumni">
      <AdminAlumniContent />
    </AdminGate>
  );
}

function AdminAlumniContent() {
  const [alumni, setAlumni] = useState<AlumniRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [angkatanFilter, setAngkatanFilter] = useState("");
  const [haulFilter, setHaulFilter] = useState("");
  const [verifFilter, setVerifFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const [rekapData, setRekapData] = useState<RekapData | null>(null);
  const [rekapLoading, setRekapLoading] = useState(false);
  const [rekapError, setRekapError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const rekapCardRef = useRef<HTMLDivElement>(null);

  const [editingRow, setEditingRow] = useState<AlumniRow | null>(null);
  const [editForm, setEditForm] = useState<AlumniData | null>(null);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rowError, setRowError] = useState<string | null>(null);

  async function loadAlumni() {
    setLoading(true);
    const params = new URLSearchParams();
    if (angkatanFilter) params.set("angkatan", angkatanFilter);
    if (haulFilter) params.set("statusKehadiran", haulFilter);
    if (verifFilter) params.set("statusVerifikasi", verifFilter);
    if (search) params.set("q", search);

    const res = await fetch(`/api/admin/alumni?${params.toString()}`);
    if (res.status === 401) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setAlumni(data.alumni ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadAlumni();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angkatanFilter, haulFilter, verifFilter, search]);

  // Debounce input pencarian supaya tidak fetch di tiap ketukan tombol.
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function handleGenerateRekap() {
    setRekapError(null);
    setDownloadError(null);
    setRekapLoading(true);
    try {
      const res = await fetch("/api/admin/rekap");
      const data = await res.json();
      if (!res.ok) {
        setRekapError(data.error ?? "Gagal memuat rekap.");
        return;
      }
      setRekapData(data);
    } catch {
      setRekapError("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setRekapLoading(false);
    }
  }

  async function handleDownloadRekap() {
    if (!rekapCardRef.current) return;
    setDownloadError(null);
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(rekapCardRef.current, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `rekap-alumni-haul-${rekapData?.tahunAcara ?? ""}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Gagal membuat gambar rekap:", err);
      setDownloadError("Gagal membuat gambar rekap. Coba lagi.");
    } finally {
      setDownloading(false);
    }
  }

  function openEdit(row: AlumniRow) {
    setRowError(null);
    setEditingRow(row);
    setEditForm(toFormData(row));
    setEditError(null);
  }

  function closeEdit() {
    setEditingRow(null);
    setEditForm(null);
    setEditError(null);
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingRow || !editForm) return;
    setEditSaving(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/admin/alumni/${editingRow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          namaLengkap: editForm.namaLengkap,
          noWhatsapp: editForm.noWhatsapp,
          alamat: editForm.alamat,
          angkatanMasuk: editForm.angkatanMasuk,
          angkatanLulus: editForm.angkatanLulus,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEditError(data.error ?? "Gagal menyimpan perubahan.");
        return;
      }
      setAlumni((prev) =>
        prev.map((a) => (a.id === editingRow.id ? { ...a, ...data.alumni } : a)),
      );
      closeEdit();
    } catch {
      setEditError("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setEditSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setRowError(null);
    try {
      const res = await fetch(`/api/admin/alumni/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setRowError(data.error ?? "Gagal menghapus data.");
        return;
      }
      setAlumni((prev) => prev.filter((a) => a.id !== id));
      setConfirmDeleteId(null);
    } catch {
      setRowError("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setDeletingId(null);
    }
  }

  const angkatanOptions = useMemo(() => {
    const years = new Set<number>();
    alumni.forEach((a) => a.angkatanMasuk && years.add(a.angkatanMasuk));
    return Array.from(years).sort((a, b) => b - a);
  }, [alumni]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-gray-600">{alumni.length} alumni ditemukan</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleGenerateRekap}
            disabled={rekapLoading}
            className="glass-button-secondary rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition active:scale-95 disabled:opacity-60"
          >
            {rekapLoading ? "Memuat..." : "Buat Laporan Rekap"}
          </button>
          <a
            href="/api/admin/export"
            className="glass-button-primary rounded-full px-4 py-2 text-sm font-medium text-white transition active:scale-95"
          >
            Export Excel
          </a>
        </div>
      </div>

      {rekapError && <p className="mt-3 text-sm text-red-600">{rekapError}</p>}

      {rekapData && (
        <div className="glass-card mt-4 rounded-[28px] p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900">
              Laporan Rekap &mdash; Haul {rekapData.tahunAcara}
            </h2>
            <p className="text-xs text-gray-500">
              Hanya angka agregat, aman dibagikan ke grup WA (tidak ada data pribadi alumni).
            </p>
          </div>

          <div className="mt-4">
            <RekapCard ref={rekapCardRef} data={rekapData} />
          </div>

          {downloadError && <p className="mt-3 text-sm text-red-600">{downloadError}</p>}

          <button
            type="button"
            onClick={handleDownloadRekap}
            disabled={downloading}
            className="glass-button-primary mx-auto mt-4 block w-full max-w-sm rounded-full py-3 text-sm font-medium text-white transition active:scale-[0.97] disabled:opacity-60"
          >
            {downloading ? "Menyiapkan gambar..." : "Download sebagai Gambar"}
          </button>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-3">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Cari nama, NIA, atau no. HP..."
          className="glass-input min-w-[220px] flex-1 rounded-2xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-green-400/40"
        />
        <select
          value={angkatanFilter}
          onChange={(e) => setAngkatanFilter(e.target.value)}
          className="glass-input rounded-2xl px-3 py-2 text-sm"
        >
          <option value="">Semua Angkatan Masuk</option>
          {angkatanOptions.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        <select
          value={haulFilter}
          onChange={(e) => setHaulFilter(e.target.value)}
          className="glass-input rounded-2xl px-3 py-2 text-sm"
        >
          <option value="">Semua Status Kehadiran</option>
          <option value="Hadir Luring">Hadir Luring</option>
          <option value="Hadir Daring/Live Streaming">Hadir Daring/Live Streaming</option>
          <option value="Tidak Hadir">Tidak Hadir</option>
        </select>
        <select
          value={verifFilter}
          onChange={(e) => setVerifFilter(e.target.value)}
          className="glass-input rounded-2xl px-3 py-2 text-sm"
        >
          <option value="">Semua Status Verifikasi</option>
          <option value="verified">Terverifikasi</option>
          <option value="unverified">Belum Diverifikasi</option>
        </select>
      </div>

      {rowError && <p className="mt-3 text-sm text-red-600">{rowError}</p>}

      {/* Desktop/tablet: tabel */}
      <div className="glass-card mt-4 hidden overflow-x-auto rounded-[28px] md:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-white/50 text-left text-gray-600">
              <th className="px-4 py-3 font-medium">NIA</th>
              <th className="px-4 py-3 font-medium">Nama</th>
              <th className="px-4 py-3 font-medium">No. WhatsApp</th>
              <th className="px-4 py-3 font-medium">Angkatan</th>
              <th className="px-4 py-3 font-medium">Verifikasi</th>
              <th className="px-4 py-3 font-medium">Kehadiran</th>
              <th className="px-4 py-3 font-medium">Pasangan</th>
              <th className="px-4 py-3 font-medium">Anak</th>
              <th className="px-4 py-3 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-400">
                  Memuat...
                </td>
              </tr>
            ) : alumni.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-6 text-center text-gray-400">
                  Tidak ada data.
                </td>
              </tr>
            ) : (
              alumni.map((a) => (
                <tr key={a.id} className="border-b border-white/40 last:border-0">
                  <td className="px-4 py-3 text-gray-600">{a.nia}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{a.namaLengkap}</td>
                  <td className="px-4 py-3 text-gray-600">{a.noWhatsapp}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {a.angkatanMasuk ?? "-"} / {a.angkatanLulus ?? "-"}
                  </td>
                  <td className="px-4 py-3">
                    {a.dataVerifiedAt ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
                        Terverifikasi
                      </span>
                    ) : (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Belum
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.partisipasi?.haul ?? "-"}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {a.partisipasi?.membawaPasangan ? "Ya" : "Tidak"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{a.partisipasi?.jumlahAnak ?? 0}</td>
                  <td className="px-4 py-3">
                    <RowActions
                      row={a}
                      confirming={confirmDeleteId === a.id}
                      busy={deletingId === a.id}
                      onEdit={() => openEdit(a)}
                      onAskDelete={() => setConfirmDeleteId(a.id)}
                      onCancelDelete={() => setConfirmDeleteId(null)}
                      onConfirmDelete={() => handleDelete(a.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile: daftar kartu */}
      <div className="mt-4 space-y-3 md:hidden">
        {loading ? (
          <p className="py-6 text-center text-sm text-gray-400">Memuat...</p>
        ) : alumni.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">Tidak ada data.</p>
        ) : (
          alumni.map((a) => (
            <div key={a.id} className="glass-card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-medium text-gray-900">{a.namaLengkap}</p>
                  <p className="text-xs text-gray-500">
                    {a.nia} &middot; {a.noWhatsapp}
                  </p>
                </div>
                {a.dataVerifiedAt ? (
                  <span className="shrink-0 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-800">
                    Terverifikasi
                  </span>
                ) : (
                  <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                    Belum
                  </span>
                )}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600">
                <span>Angkatan: {a.angkatanMasuk ?? "-"}/{a.angkatanLulus ?? "-"}</span>
                <span>Kehadiran: {a.partisipasi?.haul ?? "-"}</span>
                <span>Pasangan: {a.partisipasi?.membawaPasangan ? "Ya" : "Tidak"}</span>
                <span>Anak: {a.partisipasi?.jumlahAnak ?? 0}</span>
              </div>
              <div className="mt-3">
                <RowActions
                  row={a}
                  confirming={confirmDeleteId === a.id}
                  busy={deletingId === a.id}
                  onEdit={() => openEdit(a)}
                  onAskDelete={() => setConfirmDeleteId(a.id)}
                  onCancelDelete={() => setConfirmDeleteId(null)}
                  onConfirmDelete={() => handleDelete(a.id)}
                  fullWidth
                />
              </div>
            </div>
          ))
        )}
      </div>

      {editingRow && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto">
            {editError && (
              <p className="glass-card mb-3 rounded-2xl p-3 text-sm text-red-600">{editError}</p>
            )}
            <AlumniProfileForm
              alumni={editForm}
              setAlumni={setEditForm}
              title={`Edit Data — ${editingRow.namaLengkap}`}
              description="Perbaiki data yang keliru, lalu simpan."
              submitLabel={editSaving ? "Menyimpan..." : "Simpan Perubahan"}
              cancelLabel="Batal"
              onSubmit={handleEditSubmit}
              onCancel={closeEdit}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RowActions({
  row,
  confirming,
  busy,
  onEdit,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
  fullWidth = false,
}: {
  row: AlumniRow;
  confirming: boolean;
  busy: boolean;
  onEdit: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
  fullWidth?: boolean;
}) {
  if (confirming) {
    return (
      <div className={`flex items-center gap-2 ${fullWidth ? "w-full" : ""}`}>
        <button
          type="button"
          onClick={onConfirmDelete}
          disabled={busy}
          className={`rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition active:scale-95 disabled:opacity-60 ${fullWidth ? "flex-1" : ""}`}
        >
          {busy ? "Menghapus..." : `Yakin hapus ${row.namaLengkap}?`}
        </button>
        <button
          type="button"
          onClick={onCancelDelete}
          disabled={busy}
          className="glass-button-secondary rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 transition active:scale-95"
        >
          Batal
        </button>
      </div>
    );
  }

  return (
    <div className={`flex gap-2 ${fullWidth ? "w-full" : ""}`}>
      <button
        type="button"
        onClick={onEdit}
        className={`glass-button-secondary rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 transition active:scale-95 ${fullWidth ? "flex-1" : ""}`}
      >
        Edit
      </button>
      <button
        type="button"
        onClick={onAskDelete}
        className={`rounded-full bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 transition active:scale-95 ${fullWidth ? "flex-1" : ""}`}
      >
        Hapus
      </button>
    </div>
  );
}
