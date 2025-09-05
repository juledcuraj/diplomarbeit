/** @type {import('next').NextConfig} */

// Security headers for OWASP ZAP compliance
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; " +
           "script-src 'self' 'unsafe-eval' 'unsafe-inline'; " +  // Next.js needs unsafe-eval in dev, unsafe-inline for runtime
           "style-src 'self' 'unsafe-inline'; " +                 // Next.js injects inline styles
           "img-src 'self' data: blob:; " +
           "font-src 'self'; " +
           "connect-src 'self'; " +
           "frame-ancestors 'none'; " +
           "base-uri 'self'; " +
           "form-action 'self'"
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Cross-Origin-Resource-Policy',
    value: 'same-origin'
  },
  {
    key: 'Cross-Origin-Opener-Policy',
    value: 'same-origin'
  },
  {
    key: 'Cross-Origin-Embedder-Policy',
    value: 'require-corp'
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  }
];

const nextConfig = {
  poweredByHeader: false, // Disable framework leak: removes X-Powered-By: Next.js
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

module.exports = nextConfig;