"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import RekapCard, { RekapData } from "./RekapCard";

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

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const [alumni, setAlumni] = useState<AlumniRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [angkatanFilter, setAngkatanFilter] = useState("");
  const [haulFilter, setHaulFilter] = useState("");
  const [verifFilter, setVerifFilter] = useState("");

  const [rekapData, setRekapData] = useState<RekapData | null>(null);
  const [rekapLoading, setRekapLoading] = useState(false);
  const [rekapError, setRekapError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const rekapCardRef = useRef<HTMLDivElement>(null);

  async function loadAlumni() {
    setLoading(true);
    const params = new URLSearchParams();
    if (angkatanFilter) params.set("angkatan", angkatanFilter);
    if (haulFilter) params.set("statusKehadiran", haulFilter);
    if (verifFilter) params.set("statusVerifikasi", verifFilter);

    const res = await fetch(`/api/admin/alumni?${params.toString()}`);
    if (res.status === 401) {
      setAuthenticated(false);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setAlumni(data.alumni ?? []);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/alumni");
      setAuthenticated(res.status !== 401);
      if (res.status !== 401) {
        const data = await res.json();
        setAlumni(data.alumni ?? []);
      }
      setCheckingAuth(false);
    })();
  }, []);

  useEffect(() => {
    if (authenticated) loadAlumni();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [angkatanFilter, haulFilter, verifFilter]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoggingIn(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoggingIn(false);
    if (!res.ok) {
      setLoginError("Password salah.");
      return;
    }
    setAuthenticated(true);
    loadAlumni();
  }

  async function handleGenerateRekap() {
    setRekapError(null);
    setDownloadError(null);
    setRekapLoading(true);
    try {
      const res = await fetch("/api/admin/rekap");
      if (res.status === 401) {
        setAuthenticated(false);
        setRekapLoading(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setRekapError(data.error ?? "Gagal memuat rekap.");
        setRekapLoading(false);
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

  const angkatanOptions = useMemo(() => {
    const years = new Set<number>();
    alumni.forEach((a) => a.angkatanMasuk && years.add(a.angkatanMasuk));
    return Array.from(years).sort((a, b) => b - a);
  }, [alumni]);

  if (checkingAuth) return null;

  if (!authenticated) {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <form onSubmit={handleLogin} className="glass-card w-full max-w-sm rounded-[28px] p-6">
          <div className="mx-auto mb-3 h-12 w-12 overflow-hidden rounded-full ring-2 ring-white/70">
            <Image src="/logo.png" alt="Logo Pondok Pesantren Nurul Huda" width={48} height={48} className="h-full w-full object-cover" />
          </div>
          <h1 className="text-center text-lg font-semibold text-gray-900">Admin Login</h1>
          <p className="mt-1 text-center text-sm text-gray-600">Khusus sie kesekretariatan.</p>
          <input
            type="password"
            required
            autoFocus
            placeholder="Password admin"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="glass-input mt-4 w-full rounded-2xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-green-400/40"
          />
          {loginError && <p className="mt-2 text-sm text-red-600">{loginError}</p>}
          <button
            type="submit"
            disabled={loggingIn}
            className="glass-button-primary mt-4 w-full rounded-full py-3 text-base font-medium text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {loggingIn ? "Memeriksa..." : "Masuk"}
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="flex-1 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/70">
              <Image src="/logo.png" alt="Logo Pondok Pesantren Nurul Huda" width={40} height={40} className="h-full w-full object-cover" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Data Alumni</h1>
          </div>
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

        <div className="glass-card mt-4 overflow-x-auto rounded-[28px]">
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                    Memuat...
                  </td>
                </tr>
              ) : alumni.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
