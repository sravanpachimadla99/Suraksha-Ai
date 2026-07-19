import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent Turbopack from trying to bundle server-incompatible packages
  serverExternalPackages: ["leaflet", "react-leaflet"],

  // Suppress specific transpile issues with reactflow / framer-motion
  transpilePackages: ["reactflow", "framer-motion"],

  // Cross-origin dev access for network devices
  allowedDevOrigins: ["10.195.83.133"],
};

export default nextConfig;
