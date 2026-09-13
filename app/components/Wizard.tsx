"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlumniData,
  PartisipasiData,
  HAUL_OPTIONS,
  MENGINAP_OPTIONS,
  TAHLIL_AKBAR_OPTIONS,
} from "@/lib/types";

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
};

const variants = {
  enter: { opacity: 0, x: 24 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

export default function Wizard() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("search");
  const [phone, setPhone] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isNew, setIsNew] = useState(false);

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
          namaLengkap: alumni.namaLengkap,
          noWhatsapp: alumni.noWhatsapp,
          alamat: alumni.alamat,
          angkatanMasuk: alumni.angkatanMasuk,
          angkatanLulus: alumni.angkatanLulus,
          tahlilAkbar: partisipasi.tahlilAkbar,
          haul: partisipasi.haul,
          menginap: partisipasi.menginap,
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
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-700 text-xl font-bold text-white">
          NH
        </div>
        <h1 className="text-xl font-semibold text-gray-900">
          Portal Alumni Nurul Huda Mergosono
        </h1>
        <p className="mt-1 text-sm text-gray-500">
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
    <div className="flex items-center justify-center gap-2">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <div
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
              i <= activeIndex ? "bg-green-700 text-white" : "bg-gray-200 text-gray-500"
            }`}
          >
            {i + 1}
          </div>
          <span
            className={`text-xs ${i <= activeIndex ? "text-gray-900 font-medium" : "text-gray-400"}`}
          >
            {s.label}
          </span>
          {i < steps.length - 1 && <div className="h-px w-6 bg-gray-200" />}
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
}: {
  phone: string;
  setPhone: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <h2 className="text-base font-semibold text-gray-900">Cari data Anda</h2>
      <p className="mt-1 text-sm text-gray-500">
        Masukkan nomor HP/WhatsApp yang pernah Anda daftarkan sebelumnya.
      </p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <input
          type="tel"
          inputMode="numeric"
          required
          autoFocus
          placeholder="08xxxxxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-green-700 py-3 text-base font-medium text-white transition active:scale-[0.98] disabled:opacity-60"
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
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <h2 className="text-base font-semibold text-gray-900">
        {isNew ? "Data belum ditemukan" : "Konfirmasi data Anda"}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {isNew
          ? "Nomor ini belum terdaftar. Silakan lengkapi data di bawah untuk mendaftar."
          : "Periksa data Anda, ubah bila ada yang perlu diperbarui."}
      </p>

      {alumni.nia && (
        <p className="mt-2 text-xs text-gray-400">NIA: {alumni.nia}</p>
      )}

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <Field label="Nama Lengkap">
          <input
            required
            value={alumni.namaLengkap}
            onChange={(e) => setAlumni({ ...alumni, namaLengkap: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </Field>
        <Field label="No. WhatsApp">
          <input
            required
            type="tel"
            inputMode="numeric"
            value={alumni.noWhatsapp}
            onChange={(e) => setAlumni({ ...alumni, noWhatsapp: e.target.value })}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </Field>
        <Field label="Alamat">
          <textarea
            value={alumni.alamat}
            onChange={(e) => setAlumni({ ...alumni, alamat: e.target.value })}
            rows={2}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Angkatan Masuk">
            <input
              type="number"
              value={alumni.angkatanMasuk}
              onChange={(e) => setAlumni({ ...alumni, angkatanMasuk: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </Field>
          <Field label="Angkatan Lulus">
            <input
              type="number"
              value={alumni.angkatanLulus}
              onChange={(e) => setAlumni({ ...alumni, angkatanLulus: e.target.value })}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
            />
          </Field>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl px-4 py-3 text-base font-medium text-gray-600 transition active:scale-95"
          >
            Kembali
          </button>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-green-700 py-3 text-base font-medium text-white transition active:scale-[0.98]"
          >
            Lanjut
          </button>
        </div>
      </form>
    </div>
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
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100">
      <h2 className="text-base font-semibold text-gray-900">Konfirmasi Kehadiran</h2>
      <p className="mt-1 text-sm text-gray-500">Isi rencana kehadiran Anda pada acara Haul.</p>

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

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="rounded-xl px-4 py-3 text-base font-medium text-gray-600 transition active:scale-95 disabled:opacity-50"
          >
            Kembali
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 rounded-xl bg-green-700 py-3 text-base font-medium text-white transition active:scale-[0.98] disabled:opacity-70"
          >
            {submitting ? "Menyimpan..." : "Simpan Konfirmasi"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{label}</span>
      {children}
    </label>
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
            className={`rounded-xl border px-4 py-3 text-left text-sm transition ${
              value === opt
                ? "border-green-700 bg-green-50 text-green-900 font-medium"
                : "border-gray-200 text-gray-700"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}
