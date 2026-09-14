"use client";

import { forwardRef } from "react";

const AlumniCard = forwardRef<
  HTMLDivElement,
  {
    namaLengkap: string;
    nia: string;
    angkatanMasuk: number | null;
    angkatanLulus: number | null;
    fotoUrl: string | null;
  }
>(function AlumniCard({ namaLengkap, nia, angkatanMasuk, angkatanLulus, fotoUrl }, ref) {
  return (
    <div
      ref={ref}
      className="relative mx-auto w-full max-w-xs overflow-hidden rounded-[28px] p-6 text-center text-white shadow-lg"
      style={{
        background: "linear-gradient(160deg, #22c55e 0%, #15803d 55%, #0a3d26 100%)",
      }}
    >
      <div className="mx-auto mb-2 h-11 w-11 overflow-hidden rounded-full bg-white/90 ring-2 ring-white/60">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Logo Pondok Pesantren Nurul Huda"
          className="h-full w-full object-cover"
          crossOrigin="anonymous"
        />
      </div>
      <p className="text-[11px] font-semibold tracking-wide text-white/85 uppercase">
        Kartu Alumni Digital
      </p>
      <p className="text-xs text-white/70">Pondok Pesantren Nurul Huda Mergosono</p>

      <div className="mx-auto my-4 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white/80 bg-white/15">
        {fotoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fotoUrl}
            alt={namaLengkap}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-white/70">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
            <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}
      </div>

      <h3 className="text-lg font-semibold">{namaLengkap}</h3>
      <p className="mt-1 text-sm text-white/85">NIA: {nia}</p>
      <p className="text-sm text-white/85">
        Angkatan {angkatanMasuk ?? "-"} &ndash; {angkatanLulus ?? "-"}
      </p>
    </div>
  );
});

export default AlumniCard;
