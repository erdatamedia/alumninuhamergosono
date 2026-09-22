import type { Metadata, Viewport } from "next";
import "./globals.css";
import InstallPrompt from "./components/InstallPrompt";
import ServiceWorkerRegister from "./components/ServiceWorkerRegister";
import BottomNav from "./components/BottomNav";

export const metadata: Metadata = {
  title: "Portal Alumni Nurul Huda Mergosono",
  description: "Update data alumni & konfirmasi kehadiran acara Haul",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#15803d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <div className="ios-wallpaper">
          <div className="blob-3" />
        </div>
        {children}
        <BottomNav />
        <InstallPrompt />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
