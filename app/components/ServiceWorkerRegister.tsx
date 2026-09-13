"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Service worker gagal daftar — aplikasi tetap jalan tanpa cache offline
      });
    }
  }, []);
  return null;
}
