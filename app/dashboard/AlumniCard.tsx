"use client";

import { forwardRef, useEffect, useState } from "react";
import QRCode from "qrcode";

const AlumniCard = forwardRef<
  HTMLDivElement,
  {
    alumniId: string;
    namaLengkap: string;
    nia: string;
    angkatanMasuk: number | null;
    angkatanLulus: number | null;
    fotoUrl: string | null;
  }
>(function AlumniCard({ alumniId, namaLengkap, nia, angkatanMasuk, angkatanLulus, fotoUrl }, ref) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // Encode alumni.id (UUID), bukan NIA — NIA sekuensial gampang ditebak,
    // UUID jauh lebih aman meski risikonya sendiri rendah (cuma penanda
    // kehadiran, bukan otorisasi sensitif).
    QRCode.toDataURL(alumniId, { width: 200, margin: 1, color: { dark: "#0a3d26" } })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [alumniId]);

  return (
    <div
      ref={ref}
      className="mx-auto w-full max-w-xs overflow-hidden rounded-[28px] shadow-lg"
    >
      {/* Kop kartu: logo + nama pondok, seperti kop surat resmi */}
      <div className="flex items-center gap-3 border-b-4 border-green-700 bg-white px-5 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt="Logo Pondok Pesantren Nurul Huda"
          className="h-12 w-12 shrink-0 rounded-full object-cover ring-1 ring-gray-200"
        />
        <div className="min-w-0 text-left leading-tight">
          <p className="text-[8.5px] font-bold tracking-tight text-green-800 uppercase">
            Pondok Pesantren Salafiyah Syafi&apos;iyah
          </p>
          <p className="text-[13px] leading-snug font-extrabold text-green-900 uppercase">
            Nurul Huda Mergosono
          </p>
          <p className="text-[9px] text-gray-500">Kartu Tanda Alumni</p>
        </div>
      </div>

      {/* Body kartu: foto & data alumni */}
      <div
        className="relative p-6 text-center text-white"
        style={{
          background: "linear-gradient(160deg, #22c55e 0%, #15803d 55%, #0a3d26 100%)",
        }}
      >
        {qrDataUrl && (
          <div className="absolute top-4 right-4 rounded-lg bg-white p-1 shadow">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrDataUrl} alt="QR check-in" className="h-12 w-12" />
          </div>
        )}

        <div className="mx-auto mt-2 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-4 border-white/80 bg-white/15">
          {fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fotoUrl} alt={namaLengkap} className="h-full w-full object-cover" />
          ) : (
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" className="text-white/70">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          )}
        </div>

        <h3 className="mt-4 text-lg font-semibold">{namaLengkap}</h3>
        <p className="mt-1 text-sm text-white/85">NIA: {nia}</p>
        <p className="text-sm text-white/85">
          Angkatan {angkatanMasuk ?? "-"} &ndash; {angkatanLulus ?? "-"}
        </p>
        <p className="mt-3 text-[10px] text-white/60">Tunjukkan QR ini saat check-in di lokasi</p>
      </div>
    </div>
  );
});

export default AlumniCard;
