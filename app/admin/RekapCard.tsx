"use client";

import { forwardRef } from "react";

export type Breakdown = { label: string; count: number };

export type RekapData = {
  tahunAcara: number;
  totalVerified: number;
  totalKonfirmasi: number;
  tahlilAkbar: Breakdown[];
  haul: Breakdown[];
  menginap: Breakdown[];
  totalPasangan: number;
  totalAnak: number;
  generatedAt: string;
};

const RekapCard = forwardRef<HTMLDivElement, { data: RekapData }>(function RekapCard(
  { data },
  ref,
) {
  const tanggal = new Date(data.generatedAt).toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  });

  return (
    <div
      ref={ref}
      className="mx-auto w-full max-w-sm overflow-hidden rounded-[28px] p-7 text-white shadow-lg"
      style={{
        background: "linear-gradient(160deg, #22c55e 0%, #15803d 55%, #0a3d26 100%)",
      }}
    >
      <div className="text-center">
        <div className="mx-auto mb-3 h-14 w-14 overflow-hidden rounded-full bg-white/90 ring-2 ring-white/60">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Logo Pondok Pesantren Nurul Huda"
            className="h-full w-full object-cover"
          />
        </div>
        <h2 className="text-lg font-bold">Rekap Data Alumni</h2>
        <p className="text-sm text-white/85">Haul {data.tahunAcara}</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <BigStat value={data.totalVerified} label="Alumni Terverifikasi" />
        <BigStat value={data.totalKonfirmasi} label={`Konfirmasi Haul ${data.tahunAcara}`} />
      </div>

      <div className="mt-5 space-y-4">
        <BreakdownBlock title="Tahlil Akbar" items={data.tahlilAkbar} />
        <BreakdownBlock title="Haul" items={data.haul} />
        <BreakdownBlock title="Menginap" items={data.menginap} />

        <div className="grid grid-cols-2 gap-3">
          <SmallStat value={data.totalPasangan} label="Bawa Pasangan" />
          <SmallStat value={data.totalAnak} label="Anak Ikut Hadir" />
        </div>
      </div>

      <p className="mt-6 text-center text-[11px] text-white/70">
        Data per {tanggal} WIB &middot; snapshot langsung dari database
      </p>
    </div>
  );
});

export default RekapCard;

function BigStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/15 p-4 text-center">
      <p className="text-3xl font-bold leading-none">{value.toLocaleString("id-ID")}</p>
      <p className="mt-1 text-[11px] text-white/80">{label}</p>
    </div>
  );
}

function SmallStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl bg-white/10 p-3 text-center">
      <p className="text-xl font-semibold leading-none">{value.toLocaleString("id-ID")}</p>
      <p className="mt-1 text-[10px] text-white/75">{label}</p>
    </div>
  );
}

function BreakdownBlock({ title, items }: { title: string; items: Breakdown[] }) {
  if (items.length === 0) return null;
  return (
    <div className="rounded-xl bg-white/10 p-3">
      <p className="text-xs font-semibold text-white/90">{title}</p>
      <div className="mt-1.5 space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex justify-between text-xs text-white/85">
            <span>{item.label}</span>
            <span className="font-medium">{item.count.toLocaleString("id-ID")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
