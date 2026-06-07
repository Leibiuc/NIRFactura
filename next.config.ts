import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf2pic shells out to GraphicsMagick/Ghostscript, so it must run via native
  // require instead of being bundled. (sharp is auto-externalized by Next.)
  serverExternalPackages: ["pdf2pic"],
};

export default nextConfig;
