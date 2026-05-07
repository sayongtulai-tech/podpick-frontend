import type { Metadata, Viewport } from "next";
import "./globals.css";
import AppFrame from "@/components/app/AppFrame";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "PodPick",
  description: "감정 기반 음악 플레이리스트",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, title: "PodPick", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#a855f7",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body
        className="min-h-screen bg-[#0f0f1a] text-white"
        style={{ background: "#0f0f1a", minHeight: "100vh", color: "white" }}
      >
        <Providers>
          <AppFrame>{children}</AppFrame>
        </Providers>
      </body>
    </html>
  );
}
