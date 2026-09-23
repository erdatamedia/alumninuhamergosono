"use client";

import { useEffect, useRef, useState } from "react";
import type { Html5Qrcode } from "html5-qrcode";
import AdminGate from "../AdminGate";

const TAHUN_ACARA = process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026";

type AlumniResult = {
  id: string;
  nia: string;
  namaLengkap: string;
  noWhatsapp: string;
  angkatanMasuk: number | null;
  angkatanLulus: number | null;
  fotoUrl: string | null;
  checkedInAt: string | null;
};

function formatTime(iso: string): string {
  return (
    new Date(iso).toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }) + " WIB"
  );
}

function PlaceholderAvatar({ size = 48 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className="h-full w-full p-2 text-gray-400"
    >
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function CheckinPage() {
  return (
    <AdminGate title="Check-in Panitia" active="checkin">
      <CheckinContent />
    </AdminGate>
  );
}

function CheckinContent() {
  const [mode, setMode] = useState<"scan" | "manual">("scan");
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);

  async function handleReset() {
    setResetting(true);
    setResetError(null);
    setResetMessage(null);
    try {
      const res = await fetch("/api/admin/checkin/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setResetError(data.error ?? "Gagal reset sesi check-in.");
        return;
      }
      setResetMessage(`Sesi check-in direset — ${data.count} status check-in dikosongkan.`);
      setConfirmReset(false);
    } catch {
      setResetError("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Check-in Alumni</h2>
          <p className="mt-1 text-sm text-gray-600">
            Haul {TAHUN_ACARA} &mdash; scan QR kartu alumni atau cari manual.
          </p>
        </div>

        {confirmReset ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="rounded-full bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition active:scale-95 disabled:opacity-60"
            >
              {resetting ? "Mereset..." : "Yakin reset semua check-in?"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              disabled={resetting}
              className="glass-button-secondary rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 transition active:scale-95"
            >
              Batal
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setConfirmReset(true);
              setResetMessage(null);
              setResetError(null);
            }}
            className="glass-button-secondary shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-gray-700 transition active:scale-95"
          >
            Reset Sesi Check-in
          </button>
        )}
      </div>

      {resetMessage && <p className="mt-2 text-sm text-green-700">{resetMessage}</p>}
      {resetError && <p className="mt-2 text-sm text-red-600">{resetError}</p>}

      <div className="glass-pill mt-4 inline-flex w-fit gap-1 rounded-full p-1">
        <button
          type="button"
          onClick={() => setMode("scan")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            mode === "scan" ? "glass-pill-active text-white" : "text-gray-700"
          }`}
        >
          Scan QR
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            mode === "manual" ? "glass-pill-active text-white" : "text-gray-700"
          }`}
        >
          Cari Manual
        </button>
      </div>

      <div className="mt-4">{mode === "scan" ? <ScanMode /> : <ManualMode />}</div>
    </div>
  );
}

const QR_CONTAINER_ID = "qr-reader";

function ScanMode() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [result, setResult] = useState<AlumniResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  async function stopScanning() {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (scanner) {
      try {
        await scanner.stop();
        scanner.clear();
      } catch {
        // kamera mungkin sudah berhenti sendiri — abaikan
      }
    }
    setCameraReady(false);
  }

  async function startScanning() {
    setError(null);
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode(QR_CONTAINER_ID);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          handleDecoded(decodedText);
        },
        () => {
          // callback per-frame saat belum ada QR terbaca — normal, abaikan
        },
      );
      setCameraReady(true);
    } catch {
      setError(
        "Gagal mengakses kamera. Pastikan izin kamera diaktifkan di browser, dan halaman diakses lewat HTTPS.",
      );
    }
  }

  async function handleDecoded(alumniId: string) {
    await stopScanning();
    setError(null);
    try {
      const res = await fetch(`/api/admin/checkin/lookup?alumniId=${encodeURIComponent(alumniId)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "QR tidak dikenali.");
        return;
      }
      setResult({ ...data.alumni, checkedInAt: data.checkedInAt });
    } catch {
      setError("Gagal terhubung ke server.");
    }
  }

  async function handleConfirm() {
    if (!result) return;
    setConfirming(true);
    try {
      const res = await fetch("/api/admin/checkin/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumniId: result.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal check-in.");
        return;
      }
      setResult((prev) => (prev ? { ...prev, checkedInAt: data.checkedInAt } : prev));
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setConfirming(false);
    }
  }

  function scanAgain() {
    setResult(null);
    setError(null);
    startScanning();
  }

  useEffect(() => {
    startScanning();
    return () => {
      stopScanning();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="glass-card rounded-[28px] p-6">
      {!result && (
        <>
          <div id={QR_CONTAINER_ID} className="mx-auto overflow-hidden rounded-2xl" />
          {!cameraReady && !error && (
            <p className="mt-3 text-center text-sm text-gray-500">Memuat kamera...</p>
          )}
        </>
      )}

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="text-center">
          <div className="mx-auto h-32 w-32 overflow-hidden rounded-full bg-gray-100 ring-4 ring-green-200">
            {result.fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={result.fotoUrl}
                alt={result.namaLengkap}
                className="h-full w-full object-cover"
              />
            ) : (
              <PlaceholderAvatar />
            )}
          </div>
          <h2 className="mt-3 text-xl font-bold text-gray-900">{result.namaLengkap}</h2>
          <p className="text-sm text-gray-600">
            NIA: {result.nia} &middot; Angkatan {result.angkatanMasuk ?? "-"}/
            {result.angkatanLulus ?? "-"}
          </p>

          {result.checkedInAt ? (
            <p className="mt-4 rounded-2xl bg-green-50 p-3 text-sm font-medium text-green-800">
              Sudah check-in pukul {formatTime(result.checkedInAt)}
            </p>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              disabled={confirming}
              className="glass-button-primary mt-4 w-full rounded-full py-3 text-base font-medium text-white transition active:scale-[0.97] disabled:opacity-60"
            >
              {confirming ? "Memproses..." : "Konfirmasi Check-in"}
            </button>
          )}

          <button
            type="button"
            onClick={scanAgain}
            className="glass-button-secondary mt-3 w-full rounded-full py-3 text-sm font-medium text-gray-700 transition active:scale-95"
          >
            Scan Lagi
          </button>
        </div>
      )}
    </div>
  );
}

function ManualMode() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AlumniResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/checkin/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mencari.");
        return;
      }
      setResults(data.alumni);
      setSearched(true);
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  async function handleMark(id: string) {
    setConfirmingId(id);
    setError(null);
    try {
      const res = await fetch("/api/admin/checkin/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alumniId: id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal check-in.");
        return;
      }
      setResults((prev) =>
        prev.map((a) => (a.id === id ? { ...a, checkedInAt: data.checkedInAt } : a)),
      );
    } catch {
      setError("Gagal terhubung ke server.");
    } finally {
      setConfirmingId(null);
    }
  }

  return (
    <div className="glass-card rounded-[28px] p-6">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nama atau nomor HP..."
          className="glass-input flex-1 rounded-2xl px-4 py-3 text-base outline-none focus:ring-2 focus:ring-green-400/40"
        />
        <button
          type="submit"
          disabled={loading}
          className="glass-button-primary shrink-0 rounded-full px-5 py-3 text-sm font-medium text-white transition active:scale-95 disabled:opacity-60"
        >
          {loading ? "..." : "Cari"}
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      <div className="mt-4 space-y-2">
        {searched && results.length === 0 && !loading && (
          <p className="text-sm text-gray-500">Tidak ada hasil. Coba kata kunci lain.</p>
        )}
        {results.map((a) => (
          <div key={a.id} className="glass-input flex items-center gap-3 rounded-2xl p-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100">
              {a.fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.fotoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <PlaceholderAvatar />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-gray-900">{a.namaLengkap}</p>
              <p className="truncate text-xs text-gray-500">
                {a.nia} &middot; {a.noWhatsapp}
              </p>
            </div>
            {a.checkedInAt ? (
              <span className="shrink-0 rounded-full bg-green-100 px-3 py-1.5 text-xs font-medium text-green-800">
                Hadir {formatTime(a.checkedInAt)}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => handleMark(a.id)}
                disabled={confirmingId === a.id}
                className="glass-button-primary shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-white transition active:scale-95 disabled:opacity-60"
              >
                {confirmingId === a.id ? "..." : "Tandai Hadir"}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
