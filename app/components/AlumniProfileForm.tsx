"use client";

import { AlumniData } from "@/lib/types";
import { Field, inputClass } from "./ui";

export default function AlumniProfileForm({
  alumni,
  setAlumni,
  title,
  description,
  submitLabel = "Lanjut",
  cancelLabel = "Kembali",
  onSubmit,
  onCancel,
}: {
  alumni: AlumniData;
  setAlumni: (v: AlumniData) => void;
  title: string;
  description: string;
  submitLabel?: string;
  cancelLabel?: string;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}) {
  return (
    <div className="glass-card rounded-[28px] p-6">
      <h2 className="text-base font-semibold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-600">{description}</p>

      {alumni.nia && <p className="mt-2 text-xs text-gray-500">NIA: {alumni.nia}</p>}

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <Field label="Nama Lengkap">
          <input
            required
            value={alumni.namaLengkap}
            onChange={(e) => setAlumni({ ...alumni, namaLengkap: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="No. WhatsApp">
          <input
            required
            type="tel"
            inputMode="numeric"
            value={alumni.noWhatsapp}
            onChange={(e) => setAlumni({ ...alumni, noWhatsapp: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="Alamat">
          <textarea
            value={alumni.alamat}
            onChange={(e) => setAlumni({ ...alumni, alamat: e.target.value })}
            rows={2}
            className={inputClass}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Angkatan Masuk">
            <input
              type="number"
              value={alumni.angkatanMasuk}
              onChange={(e) => setAlumni({ ...alumni, angkatanMasuk: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Angkatan Lulus">
            <input
              type="number"
              value={alumni.angkatanLulus}
              onChange={(e) => setAlumni({ ...alumni, angkatanLulus: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="glass-button-secondary rounded-full px-5 py-3 text-base font-medium text-gray-700 transition active:scale-95"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            className="glass-button-primary flex-1 rounded-full py-3 text-base font-medium text-white transition active:scale-[0.97]"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
