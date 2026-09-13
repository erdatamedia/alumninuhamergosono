"use client";

import { useEffect, useMemo, useState } from "react";

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

  const angkatanOptions = useMemo(() => {
    const years = new Set<number>();
    alumni.forEach((a) => a.angkatanMasuk && years.add(a.angkatanMasuk));
    return Array.from(years).sort((a, b) => b - a);
  }, [alumni]);

  if (checkingAuth) return null;

  if (!authenticated) {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-100"
        >
          <h1 className="text-lg font-semibold text-gray-900">Admin Login</h1>
          <p className="mt-1 text-sm text-gray-500">Khusus sie kesekretariatan.</p>
          <input
            type="password"
            required
            autoFocus
            placeholder="Password admin"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-4 w-full rounded-xl border border-gray-200 px-4 py-3 text-base outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
          {loginError && <p className="mt-2 text-sm text-red-600">{loginError}</p>}
          <button
            type="submit"
            disabled={loggingIn}
            className="mt-4 w-full rounded-xl bg-green-700 py-3 text-base font-medium text-white transition active:scale-[0.98] disabled:opacity-60"
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
          <h1 className="text-xl font-semibold text-gray-900">Data Alumni</h1>
          <a
            href="/api/admin/export"
            className="rounded-xl bg-green-700 px-4 py-2 text-sm font-medium text-white transition active:scale-95"
          >
            Export Excel
          </a>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <select
            value={angkatanFilter}
            onChange={(e) => setAngkatanFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
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
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">Semua Status Kehadiran</option>
            <option value="Hadir Luring">Hadir Luring</option>
            <option value="Hadir Daring/Live Streaming">Hadir Daring/Live Streaming</option>
            <option value="Tidak Hadir">Tidak Hadir</option>
          </select>
          <select
            value={verifFilter}
            onChange={(e) => setVerifFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">Semua Status Verifikasi</option>
            <option value="verified">Terverifikasi</option>
            <option value="unverified">Belum Diverifikasi</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-gray-100">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-500">
                <th className="px-4 py-3 font-medium">NIA</th>
                <th className="px-4 py-3 font-medium">Nama</th>
                <th className="px-4 py-3 font-medium">No. WhatsApp</th>
                <th className="px-4 py-3 font-medium">Angkatan</th>
                <th className="px-4 py-3 font-medium">Verifikasi</th>
                <th className="px-4 py-3 font-medium">Kehadiran</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                    Memuat...
                  </td>
                </tr>
              ) : alumni.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                alumni.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 last:border-0">
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
