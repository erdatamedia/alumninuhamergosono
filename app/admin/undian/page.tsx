"use client";

import { useEffect, useState } from "react";
import AdminGate, { AdminNav } from "../AdminGate";

const TAHUN_ACARA = process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026";

type PoolItem = { id: string; namaLengkap: string; nia: string; fotoUrl: string | null };
type WinnerItem = {
  id: string;
  namaLengkap: string;
  nia: string;
  fotoUrl: string | null;
  namaHadiah: string | null;
  createdAt: string;
};

function PlaceholderAvatar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full p-4 text-gray-400">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function UndianPage() {
  return (
    <AdminGate title="Undian Doorprize">
      <UndianContent />
    </AdminGate>
  );
}

function UndianContent() {
  const [pool, setPool] = useState<PoolItem[]>([]);
  const [winners, setWinners] = useState<WinnerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [drawing, setDrawing] = useState(false);
  const [displayed, setDisplayed] = useState<PoolItem | null>(null);
  const [currentWinner, setCurrentWinner] = useState<PoolItem | null>(null);
  const [namaHadiah, setNamaHadiah] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [poolRes, winnersRes] = await Promise.all([
        fetch("/api/admin/undian/pool"),
        fetch("/api/admin/undian/winners"),
      ]);
      const poolData = await poolRes.json();
      const winnersData = await winnersRes.json();
      if (!poolRes.ok || !winnersRes.ok) {
        setError(poolData.error ?? winnersData.error ?? "Gagal memuat data.");
        return;
      }
      setPool(poolData.pool);
      setWinners(winnersData.winners);
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleKocok() {
    if (pool.length === 0 || drawing) return;
    setDrawing(true);
    setError(null);
    setCurrentWinner(null);
    setNamaHadiah("");
    const finalWinner = pool[Math.floor(Math.random() * pool.length)];

    const totalSteps = 22;
    for (let i = 0; i < totalSteps; i++) {
      const isLast = i === totalSteps - 1;
      const shown = isLast ? finalWinner : pool[Math.floor(Math.random() * pool.length)];
      setDisplayed(shown);
      const delay = 40 + (i / totalSteps) * 260;
      // eslint-disable-next-line no-await-in-loop
      await new Promise((r) => setTimeout(r, delay));
    }

    setCurrentWinner(finalWinner);
    setDrawing(false);
  }

  async function handleSaveWinner() {
    if (!currentWinner) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/undian/winner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumniId: currentWinner.id, namaHadiah }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal menyimpan pemenang.");
        return;
      }
      setPool((prev) => prev.filter((p) => p.id !== currentWinner.id));
      setWinners((prev) => [data.winner, ...prev]);
      setCurrentWinner(null);
      setDisplayed(null);
      setNamaHadiah("");
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setSaving(false);
    }
  }

  function handleBatal() {
    setCurrentWinner(null);
    setDisplayed(null);
    setNamaHadiah("");
  }

  const shownPerson = currentWinner ?? displayed;

  return (
    <main className="flex-1 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <AdminNav active="undian" />
        <h1 className="text-xl font-semibold text-gray-900">Undian Doorprize</h1>
        <p className="mt-1 text-sm text-gray-600">
          Haul {TAHUN_ACARA} &mdash; {pool.length} alumni tersisa di undian.
        </p>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <div className="glass-card mt-4 rounded-[28px] p-8 text-center">
          {loading ? (
            <p className="text-sm text-gray-500">Memuat data...</p>
          ) : shownPerson ? (
            <div>
              <div className="mx-auto h-40 w-40 overflow-hidden rounded-full bg-gray-100 ring-4 ring-green-300">
                {shownPerson.fotoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={shownPerson.fotoUrl}
                    alt={shownPerson.namaLengkap}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <PlaceholderAvatar />
                )}
              </div>
              <h2
                className={`mt-4 text-2xl font-bold text-gray-900 transition-opacity ${
                  drawing ? "opacity-70" : ""
                }`}
              >
                {shownPerson.namaLengkap}
              </h2>
              <p className="text-sm text-gray-500">NIA: {shownPerson.nia}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500">
              {pool.length === 0
                ? "Belum ada alumni yang bisa diundi (harus check-in dulu)."
                : 'Klik "Kocok!" untuk mulai undian.'}
            </p>
          )}

          {!currentWinner && (
            <button
              type="button"
              onClick={handleKocok}
              disabled={drawing || pool.length === 0 || loading}
              className="glass-button-primary mt-6 rounded-full px-8 py-4 text-lg font-bold text-white transition active:scale-95 disabled:opacity-50"
            >
              {drawing ? "Mengocok..." : "Kocok!"}
            </button>
          )}

          {currentWinner && (
            <div className="mt-6 space-y-3">
              <input
                value={namaHadiah}
                onChange={(e) => setNamaHadiah(e.target.value)}
                placeholder="Nama hadiah (opsional)"
                className="glass-input w-full rounded-2xl px-4 py-3 text-center text-base outline-none focus:ring-2 focus:ring-green-400/40"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleBatal}
                  className="glass-button-secondary flex-1 rounded-full py-3 text-sm font-medium text-gray-700 transition active:scale-95"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveWinner}
                  disabled={saving}
                  className="glass-button-primary flex-1 rounded-full py-3 text-sm font-medium text-white transition active:scale-95 disabled:opacity-60"
                >
                  {saving ? "Menyimpan..." : "Simpan sebagai Pemenang"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="glass-card mt-4 rounded-[28px] p-6">
          <h2 className="text-sm font-semibold text-gray-900">Pemenang Sesi Ini ({winners.length})</h2>
          {winners.length === 0 ? (
            <p className="mt-2 text-sm text-gray-500">Belum ada pemenang.</p>
          ) : (
            <div className="mt-3 space-y-2">
              {winners.map((w) => (
                <div key={w.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-gray-900">
                    {w.namaLengkap} <span className="text-gray-400">({w.nia})</span>
                  </span>
                  <span className="text-gray-600">{w.namaHadiah || "-"}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
