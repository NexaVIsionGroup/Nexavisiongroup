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
  // Next treats pdfkit as external, and its standard fonts are loaded by a path the tracer can't see.
  experimental: { outputFileTracingIncludes: { "/api/project/**/*": ["./node_modules/pdfkit/js/**/*", "./node_modules/@react-pdf/pdfkit/**/*"] } },
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
      // 2026-11 site renovation: the old "revenue infrastructure" pages are retired.
      { source: "/systems", destination: "/#app", permanent: true },
      { source: "/lab", destination: "/#work", permanent: true },
      { source: "/demos", destination: "/#work", permanent: true },
      { source: "/demos/:path*", destination: "/#work", permanent: true },
      { source: "/industries", destination: "/#who", permanent: true },
      { source: "/industries/:path*", destination: "/#who", permanent: true },
      {
        source: "/goodmandetailing",
        destination: "/goodman",
        permanent: true,
      },
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
