// Client-side JWT storage. The token lives in localStorage (read by the API
// client to set the Authorization header) and is mirrored into a cookie so the
// Next.js middleware can gate protected routes on the server edge.
//
// NOTE: a JS-readable token is inherent to the client-side bearer pattern — the
// browser must read it to attach the header. If you need stronger protection,
// switch the backend to httpOnly session cookies and drop this file.

const TOKEN_KEY = 'syncare_token';
export const TOKEN_COOKIE = 'syncare_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

// ~10 years — effectively "never expires", so the cookie survives browser
// restarts and the app never logs out on its own (session timeout is disabled).
const TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 365 * 10;

export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TOKEN_KEY, token);
  // Persistent cookie (survives browser close) mirroring the persisted
  // localStorage token; SameSite=Lax is enough for a same-site admin app. Add
  // `Secure` in production over HTTPS.
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; Path=/; Max-Age=${TOKEN_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function clearToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TOKEN_KEY);
  document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}
