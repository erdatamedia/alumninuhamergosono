"use client";

import { use, useState } from "react";
import Image from "next/image";
import { Field, inputClass } from "@/app/components/ui";

export default function PresensiUndianPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [noWhatsapp, setNoWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successName, setSuccessName] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/undian/masuk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, noWhatsapp }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal mendaftar presensi.");
        setLoading(false);
        return;
      }
      setSuccessName(data.namaLengkap);
    } catch {
      setError("Gagal terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="glass-card w-full max-w-sm rounded-[28px] p-6">
        <div className="mx-auto mb-3 h-14 w-14 overflow-hidden rounded-full shadow-lg ring-2 ring-white/70">
          <Image
            src="/logo.png"
            alt="Logo Pondok Pesantren Nurul Huda"
            width={56}
            height={56}
            className="h-full w-full object-cover"
            priority
          />
        </div>

        {successName ? (
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-green-700">
                <path
                  d="M5 13l4 4L19 7"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="mt-3 text-lg font-semibold text-gray-900">Berhasil terdaftar!</h1>
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-medium text-gray-900">{successName}</span> sudah tercatat ikut
              undian doorprize. Tunggu pengumuman pemenang di layar.
            </p>
          </div>
        ) : (
          <>
            <h1 className="text-center text-lg font-semibold text-gray-900">Presensi Undian Doorprize</h1>
            <p className="mt-1 text-center text-sm text-gray-600">
              Masukkan nomor WhatsApp yang terdaftar sebagai alumni untuk ikut undian doorprize.
            </p>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3">
              <Field label="No. WhatsApp">
                <input
                  required
                  type="tel"
                  inputMode="numeric"
                  autoFocus
                  placeholder="08xxxxxxxxxx"
                  value={noWhatsapp}
                  onChange={(e) => setNoWhatsapp(e.target.value)}
                  className={inputClass}
                />
              </Field>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="glass-button-primary w-full rounded-full py-3 text-base font-medium text-white transition active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "Memeriksa..." : "Daftar Ikut Undian"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs text-gray-500">
              Data Anda harus sudah terverifikasi lewat{" "}
              <a href="/" className="font-medium text-green-800 underline">
                halaman utama
              </a>{" "}
              sebelum bisa ikut undian.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
