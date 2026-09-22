"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlumniData,
  PartisipasiData,
  HAUL_OPTIONS,
  MENGINAP_OPTIONS,
  TAHLIL_AKBAR_OPTIONS,
} from "@/lib/types";
import AlumniProfileForm from "./AlumniProfileForm";
import EventInfoCard from "./EventInfoCard";
import { Field, ToggleField, inputClass } from "./ui";

const TAHUN_ACARA = process.env.NEXT_PUBLIC_TAHUN_ACARA ?? "2026";

type Step = "search" | "profile" | "attendance";

const emptyAlumni: AlumniData = {
  namaLengkap: "",
  noWhatsapp: "",
  alamat: "",
  angkatanMasuk: "",
  angkatanLulus: "",
};

const emptyPartisipasi: PartisipasiData = {
  tahlilAkbar: "",
  haul: "",
  menginap: "",
  membawaPasangan: false,
  jumlahAnak: "0",
};

const variants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

export default function Wizard({ verifiedCount }: { verifiedCount: number }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("search");
  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);
  // Nomor HP yang berhasil ditemukan lewat pencarian — bukti "tahu nomor HP",
  // dikirim balik ke server saat submit supaya alumniId saja tidak cukup
  // untuk mengubah data alumni lain (lihat app/api/alumni/confirm/route.ts).
  const [verifiedNoWhatsapp, setVerifiedNoWhatsapp] = useState<string | null>(null);

  const [alumni, setAlumni] = useState<AlumniData>(emptyAlumni);
  const [partisipasi, setPartisipasi] = useState<PartisipasiData>(emptyPartisipasi);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearchError(null);
    setSearching(true);
    try {
      const res = await fetch("/api/alumni/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ noWhatsapp: phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSearchError(data.error ?? "Terjadi kesalahan. Coba lagi.");
        return;
      }
      if (data.found) {
        setIsNew(false);
        setVerifiedNoWhatsapp(data.alumni.noWhatsapp);
        setAlumni({
          id: data.alumni.id,
          nia: data.alumni.nia,
          namaLengkap: data.alumni.namaLengkap,
          noWhatsapp: data.alumni.noWhatsapp,
          alamat: data.alumni.alamat ?? "",
          angkatanMasuk: data.alumni.angkatanMasuk?.toString() ?? "",
          angkatanLulus: data.alumni.angkatanLulus?.toString() ?? "",
          dataVerifiedAt: data.alumni.dataVerifiedAt,
        });
        setPartisipasi({
          tahlilAkbar: data.partisipasi?.tahlilAkbar ?? "",
          haul: data.partisipasi?.haul ?? "",
          menginap: data.partisipasi?.menginap ?? "",
          membawaPasangan: data.partisipasi?.membawaPasangan ?? false,
          jumlahAnak: data.partisipasi?.jumlahAnak?.toString() ?? "0",
        });
      } else {
        setIsNew(true);
        setAlumni({ ...emptyAlumni, noWhatsapp: data.noWhatsapp });
        setPartisipasi(emptyPartisipasi);
      }
      setStep("profile");
    } catch {
      setSearchError("Gagal terhubung ke server. Periksa koneksi internet Anda.");
    } finally {
      setSearching(false);
    }
  }

  function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStep("attendance");
  }

  async function handleAttendanceSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    // Optimistic UI: langsung tampilkan status tersimpan, redirect setelah konfirmasi server.
    try {
      const res = await fetch("/api/alumni/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alumniId: alumni.id,
          verifyNoWhatsapp: verifiedNoWhatsapp,
          namaLengkap: alumni.namaLengkap,
          noWhatsapp: alumni.noWhatsapp,
          alamat: alumni.alamat,
          angkatanMasuk: alumni.angkatanMasuk,
          angkatanLulus: alumni.angkatanLulus,
          tahlilAkbar: partisipasi.tahlilAkbar,
          haul: partisipasi.haul,
          menginap: partisipasi.menginap,
          membawaPasangan: partisipasi.membawaPasangan,
          jumlahAnak: partisipasi.jumlahAnak,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? "Gagal menyimpan data.");
        setSubmitting(false);
        return;
      }

      try {
        sessionStorage.setItem(
          "nhm-sukses-summary",
          JSON.stringify({ alumni: data.alumni, partisipasi: data.partisipasi }),
        );
      } catch {
        // abaikan bila sessionStorage tidak tersedia
      }
      router.push("/sukses");
    } catch {
      setSubmitError("Gagal terhubung ke server. Data belum tersimpan, coba lagi.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-8 sm:py-12">
      <header className="mb-6 text-center">
        <div className="mx-auto mb-3 h-16 w-16 overflow-hidden rounded-full shadow-lg ring-2 ring-white/70">
          <Image src="/logo.png" alt="Logo Pondok Pesantren Nurul Huda" width={64} height={64} className="h-full w-full object-cover" priority />
        </div>
        <h1 className="text-xl font-semibold text-gray-900">
          Portal Alumni Nurul Huda Mergosono
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Update data & konfirmasi kehadiran Haul {TAHUN_ACARA}
        </p>
      </header>

      <StepIndicator step={step} />

      <div className="mt-6 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {step === "search" && (
            <motion.div
              key="search"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <SearchStep
                phone={phone}
                setPhone={setPhone}
                onSubmit={handleSearch}
                loading={searching}
                error={searchError}
                verifiedCount={verifiedCount}
              />
            </motion.div>
          )}

          {step === "profile" && (
            <motion.div
              key="profile"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <ProfileStep
                alumni={alumni}
                setAlumni={setAlumni}
                isNew={isNew}
                onSubmit={handleProfileSubmit}
                onBack={() => setStep("search")}
              />
            </motion.div>
          )}

          {step === "attendance" && (
            <motion.div
              key="attendance"
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
            >
              <EventInfoCard className="mb-4" />
              <AttendanceStep
                partisipasi={partisipasi}
                setPartisipasi={setPartisipasi}
                onSubmit={handleAttendanceSubmit}
                onBack={() => setStep("profile")}
                submitting={submitting}
                error={submitError}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "search", label: "Cari" },
    { key: "profile", label: "Data Diri" },
    { key: "attendance", label: "Kehadiran" },
  ];
  const activeIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="glass-pill mx-auto flex w-fit items-center gap-2 rounded-full px-3 py-2">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all duration-300 ${
              i <= activeIndex ? "glass-pill-active text-white" : "bg-white/30 text-gray-500"
            }`}
          >
            {i + 1}
          </div>
          <span
            className={`text-xs ${i <= activeIndex ? "text-gray-900 font-medium" : "text-gray-500"}`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && <div className="h-px w-6 bg-white/60" />}
        </div>
      ))}
    </div>
  );
}

function SearchStep({
  phone,
  setPhone,
  onSubmit,
  loading,
  error,
  verifiedCount,
}: {
  phone: string;
  setPhone: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  verifiedCount: number;
}) {
  return (
    <div className="glass-card rounded-[28px] p-6">
      <h2 className="text-base font-semibold text-gray-900">Cari data Anda</h2>
      <p className="mt-1 text-sm text-gray-600">
        Masukkan nomor HP/WhatsApp yang pernah Anda daftarkan sebelumnya.
      </p>
      {verifiedCount > 0 && (
        <p className="mt-2 text-xs text-gray-500">
          {verifiedCount.toLocaleString("id-ID")} alumni sudah memperbarui data mereka.
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          type="tel"
          inputMode="numeric"
          required
          autoFocus
          placeholder="08xxxxxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="glass-button-primary w-full rounded-full py-3 text-base font-medium text-white transition active:scale-[0.97] disabled:opacity-60"
        >
          {loading ? <SkeletonButtonLabel /> : "Cari Data Saya"}
        </button>
      </form>
    </div>
  );
}

function SkeletonButtonLabel() {
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      Mencari...
    </span>
  );
}

function ProfileStep({
  alumni,
  setAlumni,
  isNew,
  onSubmit,
  onBack,
}: {
  alumni: AlumniData;
  setAlumni: (v: AlumniData) => void;
  isNew: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}) {
  return (
    <AlumniProfileForm
      alumni={alumni}
      setAlumni={setAlumni}
      title={isNew ? "Data belum ditemukan" : "Konfirmasi data Anda"}
      description={
        isNew
          ? "Nomor ini belum terdaftar. Silakan lengkapi data di bawah untuk mendaftar."
          : "Periksa data Anda, ubah bila ada yang perlu diperbarui."
      }
      submitLabel="Lanjut"
      cancelLabel="Kembali"
      onSubmit={onSubmit}
      onCancel={onBack}
    />
  );
}

function AttendanceStep({
  partisipasi,
  setPartisipasi,
  onSubmit,
  onBack,
  submitting,
  error,
}: {
  partisipasi: PartisipasiData;
  setPartisipasi: (v: PartisipasiData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  submitting: boolean;
  error: string | null;
}) {
  return (
    <div className="glass-card rounded-[28px] p-6">
      <h2 className="text-base font-semibold text-gray-900">Konfirmasi Kehadiran</h2>
      <p className="mt-1 text-sm text-gray-600">Isi rencana kehadiran Anda pada acara Haul.</p>

      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <RadioGroup
          label="Tahlil Akbar"
          options={TAHLIL_AKBAR_OPTIONS}
          value={partisipasi.tahlilAkbar}
          onChange={(v) => setPartisipasi({ ...partisipasi, tahlilAkbar: v })}
        />
        <RadioGroup
          label="Haul"
          options={HAUL_OPTIONS}
          value={partisipasi.haul}
          onChange={(v) => setPartisipasi({ ...partisipasi, haul: v })}
        />
        <RadioGroup
          label="Menginap"
          options={MENGINAP_OPTIONS}
          value={partisipasi.menginap}
          onChange={(v) => setPartisipasi({ ...partisipasi, menginap: v })}
        />

        <ToggleField
          label="Membawa pasangan (suami/istri)?"
          checked={partisipasi.membawaPasangan}
          onChange={(v) => setPartisipasi({ ...partisipasi, membawaPasangan: v })}
        />

        <Field label="Jumlah anak yang ikut hadir">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            value={partisipasi.jumlahAnak}
            onChange={(e) =>
              setPartisipasi({ ...partisipasi, jumlahAnak: e.target.value })
            }
            className={inputClass}
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="glass-button-secondary rounded-full px-5 py-3 text-base font-medium text-gray-700 transition active:scale-95 disabled:opacity-50"
          >
            Kembali
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="glass-button-primary flex-1 rounded-full py-3 text-base font-medium text-white transition active:scale-[0.97] disabled:opacity-70"
          >
            {submitting ? "Menyimpan..." : "Simpan Konfirmasi"}
          </button>
        </div>
      </form>
    </div>
  );
}

function RadioGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <span className="mb-2 block text-sm font-medium text-gray-700">{label}</span>
      <div className="grid gap-2">
        {options.map((opt) => (
          <button
            type="button"
            key={opt}
            onClick={() => onChange(opt)}
            className={`rounded-2xl px-4 py-3 text-left text-sm transition ${
              value === opt
                ? "glass-pill-active font-medium text-white"
                : "glass-button-secondary text-gray-700"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
