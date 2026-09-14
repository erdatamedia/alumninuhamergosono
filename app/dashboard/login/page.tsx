"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Field, inputClass } from "@/app/components/ui";

export default function DashboardLoginPage() {
  const router = useRouter();
  const [noWhatsapp, setNoWhatsapp] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noWhatsapp, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Gagal masuk.");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Gagal terhubung ke server. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <form onSubmit={handleSubmit} className="glass-card w-full max-w-sm rounded-[28px] p-6">
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
        <h1 className="text-center text-lg font-semibold text-gray-900">Dashboard Alumni</h1>
        <p className="mt-1 text-center text-sm text-gray-600">
          Masuk dengan nomor HP dan PIN yang sudah Anda aktifkan.
        </p>

        <div className="mt-4 space-y-3">
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
          <Field label="PIN (6 digit)">
            <input
              required
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="glass-button-primary mt-4 w-full rounded-full py-3 text-base font-medium text-white transition active:scale-[0.98] disabled:opacity-60"
        >
          {loading ? "Memeriksa..." : "Masuk"}
        </button>

        <p className="mt-4 text-center text-xs text-gray-500">
          Belum aktifkan dashboard? Cari data Anda dulu di{" "}
          <a href="/" className="font-medium text-green-800 underline">
            halaman utama
          </a>
          , lalu aktifkan setelah konfirmasi kehadiran.
        </p>
      </form>
    </main>
  );
}
