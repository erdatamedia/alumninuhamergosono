"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type Summary = {
  alumni: {
    nia: string;
    namaLengkap: string;
    noWhatsapp: string;
    alamat: string | null;
    angkatanMasuk: number | null;
    angkatanLulus: number | null;
  };
  partisipasi: {
    tahunAcara: number;
    tahlilAkbar: string | null;
    haul: string | null;
    menginap: string | null;
  };
};

export default function SuksesPage() {
  const [summary, setSummary] = useState<Summary | null | undefined>(undefined);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("nhm-sukses-summary");
      setSummary(raw ? JSON.parse(raw) : null);
    } catch {
      setSummary(null);
    }
  }, []);

  if (summary === undefined) return null;

  if (summary === null) {
    return (
      <main className="flex flex-1 items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600">Belum ada data yang dikonfirmasi.</p>
          <Link href="/" className="mt-3 inline-block text-green-700 font-medium underline">
            Kembali ke halaman utama
          </Link>
        </div>
      </main>
    );
  }

  const { alumni, partisipasi } = summary;

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-gray-100"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 12 }}
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-700"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>

        <h1 className="mt-4 text-lg font-semibold text-gray-900">Data Tersimpan</h1>
        <p className="mt-1 text-sm text-gray-500">
          Terima kasih, konfirmasi Anda untuk Haul {partisipasi.tahunAcara} sudah kami terima.
        </p>

        <div className="mt-5 space-y-2 rounded-xl bg-gray-50 p-4 text-left text-sm">
          <Row label="NIA" value={alumni.nia} />
          <Row label="Nama" value={alumni.namaLengkap} />
          <Row label="No. WhatsApp" value={alumni.noWhatsapp} />
          <Row label="Alamat" value={alumni.alamat || "-"} />
          <Row
            label="Angkatan"
            value={`${alumni.angkatanMasuk ?? "-"} / ${alumni.angkatanLulus ?? "-"}`}
          />
          <div className="my-2 h-px bg-gray-200" />
          <Row label="Tahlil Akbar" value={partisipasi.tahlilAkbar || "-"} />
          <Row label="Haul" value={partisipasi.haul || "-"} />
          <Row label="Menginap" value={partisipasi.menginap || "-"} />
        </div>

        <Link
          href="/"
          className="mt-6 inline-block w-full rounded-xl bg-green-700 py-3 text-center text-base font-medium text-white transition active:scale-[0.98]"
        >
          Kembali ke Beranda
        </Link>
      </motion.div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium text-gray-900">{value}</span>
    </div>
  );
}
