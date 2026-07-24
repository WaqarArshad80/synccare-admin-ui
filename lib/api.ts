// Typed fetch client for the SynCare backend.
//
// Every request is prefixed with NEXT_PUBLIC_API_BASE_URL and carries the JWT
// bearer token (when present). Define your endpoints as thin functions at the
// bottom of this file / in feature modules so components never touch fetch
// directly.

import { getToken } from './token';

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

if (!BASE_URL && typeof window !== 'undefined') {
  // Surfaced once in the console rather than failing silently on every call.
  console.warn(
    'NEXT_PUBLIC_API_BASE_URL is not set — API requests will hit relative URLs. ' +
      'Copy .env.local.example to .env.local and set it.',
  );
}

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  /** JSON-serializable body; set automatically with the right Content-Type. */
  body?: unknown;
  /** Query params appended to the URL. */
  params?: Record<string, string | number | boolean | undefined>;
  /** Skip attaching the Authorization header (e.g. for login). */
  skipAuth?: boolean;
};

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const cleanPath = path.replace(/^\//, '');
  const isAbsolute = /^https?:\/\//i.test(BASE_URL);

  let url: URL;
  if (isAbsolute) {
    url = new URL(cleanPath, BASE_URL.endsWith('/') ? BASE_URL : BASE_URL + '/');
  } else {
    // Relative/same-origin base (e.g. "/backend") resolved against the current
    // origin. On the server there's no window, so fall back to localhost.
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
    const prefix = ('/' + BASE_URL.replace(/^\/|\/$/g, '')).replace(/\/$/, '');
    url = new URL(`${prefix}/${cleanPath}`, origin);
  }

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

/** Like {@link apiFetch} but also returns the raw Response (for reading headers,
 *  e.g. a JWT delivered in `Authorization` rather than the body). */
export async function apiFetchWithResponse<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; response: Response }> {
  const { body, params, skipAuth, headers, ...rest } = options;

  const finalHeaders = new Headers(headers);
  finalHeaders.set('Accept', 'application/json');

  if (body !== undefined && !(body instanceof FormData)) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  if (!skipAuth) {
    const token = getToken();
    if (token) finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(buildUrl(path, params), {
      // Never serve API data from a cache — always hit the backend for fresh
      // data. Covers the browser HTTP cache and Next's fetch data cache.
      // Callers can still override by passing `cache` explicitly.
      cache: 'no-store',
      ...rest,
      headers: finalHeaders,
      body:
        body === undefined
          ? undefined
          : body instanceof FormData
            ? body
            : JSON.stringify(body),
    });
  } catch (err) {
    throw new ApiError(0, 'Network error — could not reach the API.', err);
  }

  // Session timeout is disabled: a 401 is surfaced as a normal error (below)
  // rather than clearing the token and bouncing to /login, so the app never
  // logs the user out on its own. Use the sidebar's Log out button to sign out.

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const message =
      (isJson && payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message: unknown }).message)
        : undefined) ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, message, payload);
  }

  return { data: payload as T, response: res };
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await apiFetchWithResponse<T>(path, options);
  return data;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: RequestOptions) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
};
