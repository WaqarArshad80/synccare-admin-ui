import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Where the Next server forwards proxied API calls. Server-side only (no
// NEXT_PUBLIC_ prefix) — the browser never sees this and only ever talks to the
// same-origin `/backend` prefix, which sidesteps the backend's missing CORS.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? 'http://localhost:4080';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the file-tracing root to this project (a stray lockfile in $HOME was
  // being picked up as the root otherwise).
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [
      {
        source: '/backend/:path*',
        destination: `${API_PROXY_TARGET}/:path*`,
      },
    ];
  },
};

export default nextConfig;
