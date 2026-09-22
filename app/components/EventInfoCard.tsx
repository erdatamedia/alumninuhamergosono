"use client";

import { motion } from "framer-motion";
import { EVENT_INFO } from "@/lib/event-info";

export default function EventInfoCard({ className = "" }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`glass-card rounded-[28px] p-6 ${className}`}
    >
      <h2 className="text-base font-semibold text-gray-900">{EVENT_INFO.judul}</h2>
      <p className="mt-1 text-sm text-gray-600">{EVENT_INFO.lokasi}</p>

      <div className="mt-4 space-y-3">
        {EVENT_INFO.hari.map((h) => (
          <div key={h.tanggal} className="glass-input rounded-2xl p-4">
            <p className="text-sm font-semibold text-gray-900">{h.tanggal}</p>
            <p className="text-xs text-gray-600">
              {h.nama} &middot; {h.waktu}
            </p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-gray-700">
              {h.sesi.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
