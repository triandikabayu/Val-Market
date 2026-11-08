import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // static export: the app ships inside the Tauri desktop shell, no server
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
