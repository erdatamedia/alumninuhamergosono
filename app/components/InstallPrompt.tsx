"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "nhm-install-prompt-shown";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia?.("(display-mode: standalone)").matches || nav.standalone === true;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showAndroidBanner, setShowAndroidBanner] = useState(false);
  const [showIosBanner, setShowIosBanner] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    let alreadyShown = false;
    try {
      alreadyShown = localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // localStorage tidak tersedia (mode private dsb) — anggap belum pernah ditampilkan
    }
    if (alreadyShown) return;

    if (isIos()) {
      setShowIosBanner(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowAndroidBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  function dismiss() {
    setShowAndroidBanner(false);
    setShowIosBanner(false);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // abaikan bila localStorage tidak tersedia
    }
  }

  async function handleInstallClick() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  }

  const visible = showAndroidBanner || showIosBanner;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 24, stiffness: 260 }}
          className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4"
        >
          <div className="glass-card mx-auto flex max-w-md items-center gap-3 rounded-3xl p-4">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-2 ring-white/70">
              <Image src="/logo.png" alt="Logo Pondok Pesantren Nurul Huda" width={40} height={40} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 text-sm">
              {showAndroidBanner ? (
                <p className="text-gray-700">
                  Install aplikasi ini di layar utama untuk akses lebih cepat.
                </p>
              ) : (
                <p className="text-gray-700">
                  Tap tombol <span className="font-semibold">Share</span> lalu pilih{" "}
                  <span className="font-semibold">&ldquo;Add to Home Screen&rdquo;</span> untuk install
                  aplikasi ini.
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              {showAndroidBanner && (
                <button
                  onClick={handleInstallClick}
                  className="glass-button-primary rounded-full px-3 py-1.5 text-sm font-medium text-white transition active:scale-95"
                >
                  Install
                </button>
              )}
              <button
                onClick={dismiss}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-gray-500 transition active:scale-95"
              >
                Tutup
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
