/** @type {import('next').NextConfig} */
const VERIFY_HOST = "verify.apply.nexavisiongroup.com";

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

  // verify.apply.nexavisiongroup.com/<token>  ->  internal /verify/<token>.
  // afterFiles: real pages/assets resolve first; a bare token (not a real
  // route) falls through to here.
  async rewrites() {
    return {
      afterFiles: [
        {
          source: "/:token",
          has: [{ type: "host", value: VERIFY_HOST }],
          destination: "/verify/:token",
        },
      ],
    };
  },

  // Any other host hitting the old /verify/<token> path is permanently
  // redirected to the dedicated subdomain (new-subdomain-only policy, but
  // already-sent links keep working via this redirect).
  async redirects() {
    return [
      {
        source: "/verify/:token",
        missing: [{ type: "host", value: VERIFY_HOST }],
        destination: `https://${VERIFY_HOST}/:token`,
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
