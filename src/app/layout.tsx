import type { Metadata, Viewport } from "next";
import { SessionProvider } from "@/lib/session";
import "@fontsource/anton/400.css";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";

export const metadata: Metadata = {
  title: "val-market — Valorant store checker",
  description:
    "Check your full Valorant store — daily skins, bundle, accessories, night market — without launching the game. Credentials go browser-to-Riot only.",
};

export const viewport: Viewport = {
  themeColor: "#0F1923",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
