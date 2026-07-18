import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// The same-origin API proxy lives in app/backend/[...path]/route.ts (a Node
// route handler with no socket timeout) rather than a `rewrites()` entry, so
// that multi-minute sync calls don't hit undici's ~5-minute proxy timeout and
// get reset. Set API_PROXY_TARGET to point it at the backend.

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Pin the file-tracing root to this project (a stray lockfile in $HOME was
  // being picked up as the root otherwise).
  outputFileTracingRoot: __dirname,
};

export default nextConfig;
