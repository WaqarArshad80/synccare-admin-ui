// API types for the PCC Integration Service (SynCare).

/** Signed-in user. Merged from /auth/profile and/or the JWT claims. */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  organizationId?: string;
  /** Permission strings carried in the JWT (e.g. "View Patient"). */
  permissions?: string[];
}

/** Raw shape returned by GET /auth/profile and GET /admin/profile. */
export interface ProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  organizationId: string;
  createdDate?: string;
  lastLoginDate?: string;
}

/** GET /auth/login response body. */
export interface LoginResponse {
  token: string;
  type: string; // "Bearer"
  username: string;
}

/** An element of GET /organizations. */
export interface Organization {
  id: string;
  name: string;
  email: string;
  address: string;
  pccOrgUuid: string;
  pccOrgCode: string;
  createdAt: string;
  updatedAt: string;
}

/** Editable fields for POST /organizations. `id`, `createdAt`, `updatedAt` are
 *  server-generated and omitted. */
export type CreateOrganizationInput = Pick<
  Organization,
  'name' | 'email' | 'address' | 'pccOrgUuid' | 'pccOrgCode'
>;

/** GET /app-config/{id} → a runtime config document (e.g. pcc_api_quota). */
export interface AppConfig {
  id: string;
  data: Record<string, unknown>;
  updatedAt?: string;
}

/** A user row from GET /admin/users (UserProfileResponse). */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: string;
  organizationId: string;
  createdDate?: string;
  lastLoginDate?: string;
}

/** POST /admin/user (RegisterRequest). `role` is restricted to doctor|nurse. */
export interface CreateUserInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  role?: string;
}

/** PUT /admin/users/{id} — ASSUMED endpoint (no update endpoint exists in the
 *  API yet). Password is intentionally excluded. Adjust when the backend adds it. */
export interface UpdateUserInput {
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  role?: string;
  /** Only sent when the admin is changing the user's password. */
  password?: string;
}
