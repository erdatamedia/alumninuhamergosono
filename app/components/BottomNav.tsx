"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  {
    href: "/",
    label: "Beranda",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <path
          d="M4 11.5 12 4l8 7.5M6 10v9a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1v-9"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    href: "/info",
    label: "Info Acara",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} />
        <path d="M12 11v5.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} strokeLinecap="round" />
        <circle cx="12" cy="8" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth={active ? 2.2 : 1.7} />
        <path
          d="M5 20c0-3.5 3.2-6 7-6s7 2.5 7 6"
          stroke="currentColor"
          strokeWidth={active ? 2.2 : 1.7}
          strokeLinecap="round"
        />
      </svg>
    ),
  },
] as const;

// Sembunyikan di halaman admin & dashboard — keduanya sudah punya navigasi sendiri.
const HIDDEN_PREFIXES = ["/admin", "/dashboard"];

export default function BottomNav() {
  const pathname = usePathname();

  if (HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return null;
  }

  return (
    <>
      {/* Spacer supaya konten halaman tidak tertutup bar fixed di bawah. */}
      <div className="h-20 md:hidden" aria-hidden="true" />
      <nav className="glass-card fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-3xl px-2 py-2 md:hidden">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-2xl py-2 text-[11px] font-medium transition ${
                active ? "text-green-800" : "text-gray-500"
              }`}
            >
              {item.icon(active)}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
