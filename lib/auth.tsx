'use client';

// Client-side auth context: holds the current user, exposes login/logout, and
// bootstraps from a stored token on load by calling /auth/me.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { authApi } from './endpoints';
import { clearToken, getToken, setToken } from './token';
import { isJwtExpired, userFromJwt } from './jwt';
import { isAllowedRole } from './access';
import type { AuthUser } from './types';

/** Thrown when a valid login is rejected because the role isn't permitted. */
export class AccessDeniedError extends Error {
  constructor(message = 'Access denied — only superadmin users can sign in.') {
    super(message);
    this.name = 'AccessDeniedError';
  }
}

interface AuthContextValue {
  user: AuthUser | null;
  /** True until the initial token check resolves. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Resolve the signed-in user from a token: rich profile from /auth/profile,
 *  enriched with the permissions/orgId that only live in the JWT. Falls back to
 *  pure JWT claims if the profile call fails. Returns null if nothing usable. */
async function resolveUser(token: string): Promise<AuthUser | null> {
  const fromJwt = userFromJwt(token);
  try {
    const profile = await authApi.me();
    return {
      ...profile,
      organizationId: profile.organizationId ?? fromJwt?.organizationId,
      permissions: fromJwt?.permissions,
    };
  } catch {
    return fromJwt;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      // Drop an expired token before doing anything else.
      if (isJwtExpired(token)) {
        clearToken();
        setLoading(false);
        return;
      }
      const resolved = await resolveUser(token);
      if (!cancelled) {
        if (resolved && isAllowedRole(resolved.role)) {
          setUser(resolved);
        } else {
          // Not a superadmin (or unresolvable) — drop the session.
          clearToken();
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login?denied=1';
          }
        }
        setLoading(false);
      }
    }
    bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { token } = await authApi.login(email, password);
    setToken(token);
    const resolved = await resolveUser(token);
    if (!resolved || !isAllowedRole(resolved.role)) {
      clearToken();
      throw new AccessDeniedError();
    }
    setUser(resolved);
  };

  const logout = () => {
    clearToken();
    setUser(null);
    if (typeof window !== 'undefined') window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
