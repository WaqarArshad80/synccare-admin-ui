import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TOKEN_COOKIE } from './lib/token';
import { decodeJwt } from './lib/jwt';
import { isAllowedRole } from './lib/access';

// Edge route guard. Only a superadmin token is treated as authenticated — the
// role is read from the JWT claim (no signature check; the API is the real
// authority). Non-superadmin/expired/missing tokens are sent to /login.

const PUBLIC_PATHS = ['/login'];

/** True if the cookie holds a superadmin JWT. Token expiry is intentionally not
 *  enforced — session timeout is disabled, so the app never logs out on its own. */
function isAuthorized(token: string | undefined): boolean {
  if (!token) return false;
  const claims = decodeJwt(token);
  if (!claims) return false;
  const role = claims.role ?? (Array.isArray(claims.roles) ? claims.roles[0] : claims.roles);
  return isAllowedRole(typeof role === 'string' ? role : undefined);
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const authorized = isAuthorized(token);
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (!authorized && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    // A present-but-rejected token → flag it and clear the stale cookie so we
    // don't bounce back here (the client also clears localStorage on load).
    if (token) url.searchParams.set('denied', '1');
    else url.searchParams.set('from', pathname);
    const res = NextResponse.redirect(url);
    if (token) res.cookies.delete(TOKEN_COOKIE);
    return res;
  }

  if (authorized && isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except Next internals, static assets, and the /backend
  // API proxy (that's forwarded to the real API, which enforces its own auth —
  // gating it here would redirect the login POST to the login page).
  matcher: ['/((?!_next/static|_next/image|favicon.ico|backend|.*\\.).*)'],
};
