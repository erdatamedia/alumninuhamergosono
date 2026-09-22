"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type ActiveTab = "alumni" | "checkin" | "undian";

const NAV_ITEMS: { key: ActiveTab; label: string; href: string }[] = [
  { key: "alumni", label: "Data Alumni", href: "/admin" },
  { key: "checkin", label: "Check-in", href: "/admin/checkin" },
  { key: "undian", label: "Undian", href: "/admin/undian" },
];

export default function AdminGate({
  title,
  active,
  children,
}: {
  title: string;
  active: ActiveTab;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await fetch("/api/admin/me");
      setAuthenticated(res.status !== 401);
      setChecking(false);
    })();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoggingIn(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoggingIn(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Password salah.");
      return;
    }
    setAuthenticated(true);
  }

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/admin/login", { method: "DELETE" });
    setLoggingOut(false);
    setAuthenticated(false);
    router.push("/admin");
  }

  if (checking) return null;

  if (!authenticated) {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <form onSubmit={handleLogin} className="glass-card w-full max-w-sm rounded-[28px] p-6">
          <div className="mx-auto mb-3 h-12 w-12 overflow-hidden rounded-full ring-2 ring-white/70">
            <Image
              src="/logo.png"
              alt="Logo Pondok Pesantren Nurul Huda"
              width={48}
              height={48}
              className="h-full w-full object-cover"
            />
          </div>
          <h1 className="text-center text-lg font-semibold text-gray-900">{title}</h1>
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
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
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
    <main className="flex-1 px-4 py-6 sm:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white/70">
              <Image
                src="/logo.png"
                alt="Logo Pondok Pesantren Nurul Huda"
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
              <p className="text-xs text-gray-500">Panel Sie Kesekretariatan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="glass-button-secondary shrink-0 rounded-full px-4 py-2 text-sm font-medium text-gray-700 transition active:scale-95 disabled:opacity-60"
          >
            {loggingOut ? "..." : "Keluar"}
          </button>
        </div>

        <nav className="mb-4 flex flex-wrap gap-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                active === item.key
                  ? "glass-pill-active text-white"
                  : "glass-button-secondary text-gray-700"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {children}
      </div>
    </main>
  );
}
