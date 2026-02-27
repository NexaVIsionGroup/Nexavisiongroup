/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
      },
    ],
  },
  // Performance optimizations
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
};

module.exports = nextConfig;
