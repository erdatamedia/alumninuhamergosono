"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AdminGate from "../AdminGate";

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
    <AdminGate title="Undian Doorprize" active="undian">
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

  const [presentation, setPresentation] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

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

  // Sinkron kalau user keluar fullscreen pakai Escape (bukan lewat tombol kita).
  useEffect(() => {
    function onFullscreenChange() {
      if (!document.fullscreenElement) setPresentation(false);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  async function togglePresentation() {
    if (presentation) {
      setPresentation(false);
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch {
          // abaikan
        }
      }
      return;
    }
    setPresentation(true);
    try {
      await document.documentElement.requestFullscreen();
    } catch {
      // sebagian browser/konteks menolak fullscreen — overlay tetap tampil
      // penuh layar lewat CSS, cukup untuk ditampilkan di TV/videotron.
    }
  }

  async function handleUndi() {
    if (pool.length === 0 || drawing) return;
    setDrawing(true);
    setError(null);
    setCurrentWinner(null);
    setNamaHadiah("");
    const finalWinner = pool[Math.floor(Math.random() * pool.length)];

    const totalSteps = 26;
    for (let i = 0; i < totalSteps; i++) {
      const isLast = i === totalSteps - 1;
      const shown = isLast ? finalWinner : pool[Math.floor(Math.random() * pool.length)];
      setDisplayed(shown);
      const delay = 40 + (i / totalSteps) ** 2 * 320;
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

  async function handleResetUndian() {
    setResetting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/undian/winners", { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal reset sesi undian.");
        return;
      }
      setWinners([]);
      setResetMessage(`Sesi undian direset — ${data.count} catatan pemenang dihapus.`);
      setConfirmReset(false);
      await loadData();
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setResetting(false);
    }
  }

  const shownPerson = currentWinner ?? displayed;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Undian Doorprize</h2>
          <p className="mt-1 text-sm text-gray-600">
            Haul {TAHUN_ACARA} &mdash; {pool.length} alumni tersisa di undian.
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={togglePresentation}
            className="glass-button-secondary rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 transition active:scale-95"
          >
            Mode Layar Besar
          </button>
          {confirmReset ? (
            <>
              <button
                type="button"
                onClick={handleResetUndian}
                disabled={resetting}
                className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition active:scale-95 disabled:opacity-60"
              >
                {resetting ? "Mereset..." : "Yakin reset sesi undian?"}
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                disabled={resetting}
                className="glass-button-secondary rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 transition active:scale-95"
              >
                Batal
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => {
                setConfirmReset(true);
                setResetMessage(null);
              }}
              className="glass-button-secondary rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 transition active:scale-95"
            >
              Reset Sesi Undian
            </button>
          )}
        </div>
      </div>

      {resetMessage && <p className="mt-2 text-sm text-green-700">{resetMessage}</p>}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <DrawCard
        loading={loading}
        shownPerson={shownPerson}
        drawing={drawing}
        currentWinner={currentWinner}
        pool={pool}
        namaHadiah={namaHadiah}
        setNamaHadiah={setNamaHadiah}
        saving={saving}
        onUndi={handleUndi}
        onBatal={handleBatal}
        onSave={handleSaveWinner}
      />

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

      {presentation && (
        <PresentationOverlay
          shownPerson={shownPerson}
          drawing={drawing}
          currentWinner={currentWinner}
          pool={pool}
          namaHadiah={namaHadiah}
          setNamaHadiah={setNamaHadiah}
          saving={saving}
          onUndi={handleUndi}
          onBatal={handleBatal}
          onSave={handleSaveWinner}
          onExit={togglePresentation}
        />
      )}
    </div>
  );
}

function PersonPhoto({
  person,
  size,
  pulsing,
}: {
  person: PoolItem | null;
  size: number;
  pulsing: boolean;
}) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={person?.id ?? "empty"}
        initial={{ opacity: 0, scale: 0.7, rotate: -4 }}
        animate={{
          opacity: 1,
          scale: pulsing ? [1, 1.04, 1] : 1,
          rotate: 0,
        }}
        exit={{ opacity: 0, scale: 1.2, rotate: 4 }}
        transition={
          pulsing
            ? { scale: { duration: 0.5, repeat: Infinity }, opacity: { duration: 0.12 } }
            : { type: "spring", stiffness: 260, damping: 16 }
        }
        style={{ width: size, height: size }}
        className="mx-auto overflow-hidden rounded-full bg-white/15 ring-4 ring-white/50"
      >
        {person?.fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.fotoUrl} alt={person.namaLengkap} className="h-full w-full object-cover" />
        ) : (
          <PlaceholderAvatar />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function PersonName({
  person,
  className,
}: {
  person: PoolItem | null;
  className: string;
}) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.h1
        key={person?.id ?? "empty"}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.15 }}
        className={className}
      >
        {person?.namaLengkap ?? ""}
      </motion.h1>
    </AnimatePresence>
  );
}

type DrawCardProps = {
  shownPerson: PoolItem | null;
  drawing: boolean;
  currentWinner: PoolItem | null;
  pool: PoolItem[];
  namaHadiah: string;
  setNamaHadiah: (v: string) => void;
  saving: boolean;
  onUndi: () => void;
  onBatal: () => void;
  onSave: () => void;
};

function DrawCard({
  loading,
  shownPerson,
  drawing,
  currentWinner,
  pool,
  namaHadiah,
  setNamaHadiah,
  saving,
  onUndi,
  onBatal,
  onSave,
}: DrawCardProps & { loading: boolean }) {
  return (
    <div className="glass-card mt-4 rounded-[28px] p-8 text-center">
      {loading ? (
        <p className="text-sm text-gray-500">Memuat data...</p>
      ) : shownPerson ? (
        <div>
          <PersonPhoto person={shownPerson} size={160} pulsing={drawing} />
          <PersonName
            person={shownPerson}
            className="mt-4 text-2xl font-bold text-gray-900"
          />
          <p className="text-sm text-gray-500">NIA: {shownPerson.nia}</p>
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          {pool.length === 0
            ? "Belum ada alumni yang bisa diundi (harus check-in dulu)."
            : 'Klik "Mulai Undian" untuk mengundi.'}
        </p>
      )}

      {!currentWinner && (
        <button
          type="button"
          onClick={onUndi}
          disabled={drawing || pool.length === 0 || loading}
          className="glass-button-primary mt-6 rounded-full px-8 py-4 text-lg font-bold text-white transition active:scale-95 disabled:opacity-50"
        >
          {drawing ? "Mengundi..." : "Mulai Undian"}
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
              onClick={onBatal}
              className="glass-button-secondary flex-1 rounded-full py-3 text-sm font-medium text-gray-700 transition active:scale-95"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="glass-button-primary flex-1 rounded-full py-3 text-sm font-medium text-white transition active:scale-95 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan sebagai Pemenang"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function PresentationOverlay({
  shownPerson,
  drawing,
  currentWinner,
  pool,
  namaHadiah,
  setNamaHadiah,
  saving,
  onUndi,
  onBatal,
  onSave,
  onExit,
}: DrawCardProps & { onExit: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 text-center text-white"
      style={{
        background: "linear-gradient(160deg, #15803d 0%, #0a3d26 60%, #052014 100%)",
      }}
    >
      <button
        type="button"
        onClick={onExit}
        className="absolute top-6 right-6 rounded-full bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25 active:scale-95"
      >
        Tutup Layar Besar
      </button>

      {shownPerson ? (
        <div>
          <PersonPhoto person={shownPerson} size={320} pulsing={drawing} />
          <PersonName
            person={shownPerson}
            className="mt-8 text-6xl font-extrabold sm:text-7xl lg:text-8xl"
          />
          <p className="mt-4 text-xl text-white/70 sm:text-2xl">NIA: {shownPerson.nia}</p>
        </div>
      ) : (
        <p className="text-2xl text-white/80 sm:text-3xl">
          {pool.length === 0
            ? "Belum ada alumni yang bisa diundi (harus check-in dulu)."
            : 'Klik "Mulai Undian" untuk mengundi.'}
        </p>
      )}

      {!currentWinner && (
        <button
          type="button"
          onClick={onUndi}
          disabled={drawing || pool.length === 0}
          className="mt-12 rounded-full bg-white px-12 py-5 text-2xl font-extrabold text-green-800 shadow-xl transition active:scale-95 disabled:opacity-50"
        >
          {drawing ? "Mengundi..." : "Mulai Undian"}
        </button>
      )}

      {currentWinner && (
        <div className="mt-10 w-full max-w-md space-y-3">
          <input
            value={namaHadiah}
            onChange={(e) => setNamaHadiah(e.target.value)}
            placeholder="Nama hadiah (opsional)"
            className="w-full rounded-2xl bg-white/15 px-4 py-3 text-center text-lg text-white placeholder-white/60 outline-none backdrop-blur focus:bg-white/25"
          />
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBatal}
              className="flex-1 rounded-full bg-white/15 py-3 text-base font-medium text-white backdrop-blur transition active:scale-95"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="flex-1 rounded-full bg-white py-3 text-base font-bold text-green-800 transition active:scale-95 disabled:opacity-60"
            >
              {saving ? "Menyimpan..." : "Simpan sebagai Pemenang"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
