// Access policy: only superadmin users may use this console. Enforced in the
// client auth layer (login + session bootstrap) and in the edge middleware.
// NOTE: this is UI gating — the backend must still authorize every request.

/** The single role permitted to sign in. */
export const ALLOWED_ROLE = 'superadmin';

/**
 * True if `role` counts as superadmin. Normalizes casing and separators so
 * "superadmin", "super_admin", "SUPER-ADMIN" and "ROLE_SUPERADMIN" all match.
 */
export function isAllowedRole(role?: string | null): boolean {
  if (!role) return false;
  const normalized = role.toLowerCase().replace(/^role_/, '').replace(/[_\s-]/g, '');
  return normalized === ALLOWED_ROLE;
}
