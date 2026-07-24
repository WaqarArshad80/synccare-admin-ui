// Decode a JWT payload (no signature verification — that's the backend's job).
// Used to derive a display identity from the login token when the API doesn't
// return a user object and has no /auth/me endpoint.

import type { AuthUser } from './types';

export interface JwtClaims {
  sub?: string;
  email?: string;
  name?: string;
  role?: string;
  roles?: string[] | string;
  authorities?: string[] | string;
  organizationId?: string;
  permissions?: string[];
  exp?: number;
  [key: string]: unknown;
}

function base64UrlDecode(segment: string): string {
  const padded = segment.replace(/-/g, '+').replace(/_/g, '/');
  const withPad = padded + '='.repeat((4 - (padded.length % 4)) % 4);
  if (typeof atob === 'function') return atob(withPad);
  return Buffer.from(withPad, 'base64').toString('binary');
}

export function decodeJwt(token: string): JwtClaims | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const json = decodeURIComponent(
      Array.from(base64UrlDecode(parts[1]))
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join(''),
    );
    return JSON.parse(json) as JwtClaims;
  } catch {
    return null;
  }
}

/** Session timeout is disabled — the app never expires a token client-side, so
 *  this always reports "not expired". (Previously compared the JWT `exp` claim
 *  against the clock.) */
export function isJwtExpired(_token: string): boolean {
  return false;
}

function firstRole(claims: JwtClaims): string {
  const raw = claims.role ?? claims.roles ?? claims.authorities;
  if (Array.isArray(raw)) return raw[0] ?? '';
  if (typeof raw === 'string') return raw.split(/[,\s]+/)[0] ?? '';
  return '';
}

/** Build a best-effort AuthUser from JWT claims (fallback when the API gives
 *  no user object). */
export function userFromJwt(token: string): AuthUser | null {
  const claims = decodeJwt(token);
  if (!claims) return null;
  const email = claims.email ?? (isEmail(claims.sub) ? claims.sub : undefined);
  return {
    id: claims.sub ?? email ?? 'me',
    name: claims.name ?? email ?? claims.sub ?? 'Account',
    email: email ?? '',
    role: firstRole(claims),
    organizationId: claims.organizationId,
    permissions: Array.isArray(claims.permissions) ? claims.permissions : undefined,
  };
}

function isEmail(value: unknown): value is string {
  return typeof value === 'string' && /.+@.+\..+/.test(value);
}
