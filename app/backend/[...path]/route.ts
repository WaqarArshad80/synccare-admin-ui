// Same-origin API proxy: forwards /backend/* to the real SynCare backend so the
// browser never faces the backend's missing CORS.
//
// We proxy with Node's raw http/https module rather than Next's `rewrites` (or
// global fetch) on purpose: those inherit undici's ~5-minute headers/body
// timeout, which resets ("socket hang up" / ECONNRESET) on the sync endpoints
// that legitimately run for several minutes. Here we set the socket timeout to
// 0 (disabled) and stream both directions, so a slow backend just takes as long
// as it takes.

import type { NextRequest } from 'next/server';
import http from 'node:http';
import https from 'node:https';
import { Readable } from 'node:stream';

// Server-side only (no NEXT_PUBLIC_ prefix) — the browser only ever talks to the
// same-origin `/backend` prefix.
const API_PROXY_TARGET = process.env.API_PROXY_TARGET ?? 'http://localhost:4080';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Hop-by-hop headers that must not be forwarded verbatim (RFC 7230 §6.1); the
// runtime manages framing/connection itself.
const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

function proxy(req: NextRequest, pathParts: string[]): Promise<Response> {
  const target = new URL(API_PROXY_TARGET);
  const client = target.protocol === 'https:' ? https : http;

  const upstreamPath = '/' + pathParts.map(encodeURIComponent).join('/') + req.nextUrl.search;

  // Byte-exact passthrough: keep the client's headers (incl. content-length so
  // the upstream body isn't forced to chunked), minus host + hop-by-hop ones.
  const outHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key) && key !== 'host') outHeaders[key] = value;
  });

  return new Promise<Response>((resolve, reject) => {
    const upstream = client.request(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        port: target.port || (target.protocol === 'https:' ? 443 : 80),
        method: req.method,
        path: upstreamPath,
        headers: outHeaders,
      },
      (res) => {
        const headers = new Headers();
        for (const [key, value] of Object.entries(res.headers)) {
          if (HOP_BY_HOP.has(key) || value === undefined) continue;
          if (Array.isArray(value)) value.forEach((v) => headers.append(key, v));
          else headers.set(key, value);
        }
        resolve(
          new Response(Readable.toWeb(res) as ReadableStream, {
            status: res.statusCode ?? 502,
            statusText: res.statusMessage,
            headers,
          }),
        );
      },
    );

    // The whole point: never time the socket out — some sync calls take minutes.
    upstream.setTimeout(0);
    upstream.on('error', (err) => {
      reject(new Response(`Proxy error: ${err.message}`, { status: 502 }));
    });

    if (req.body) {
      Readable.fromWeb(req.body as import('node:stream/web').ReadableStream).pipe(upstream);
    } else {
      upstream.end();
    }
  }).catch((errOrResponse) =>
    errOrResponse instanceof Response
      ? errOrResponse
      : new Response('Bad gateway', { status: 502 }),
  );
}

type Ctx = { params: Promise<{ path: string[] }> };

async function handler(req: NextRequest, ctx: Ctx): Promise<Response> {
  const { path } = await ctx.params;
  return proxy(req, path ?? []);
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
  handler as HEAD,
  handler as OPTIONS,
};
