// Feature endpoint definitions for the PCC Integration Service. Components and
// hooks call these named functions, never raw fetch.

import { api, apiFetchWithResponse } from './api';
import type {
  AppConfig,
  AuthUser,
  CreateOrganizationInput,
  CreateUserInput,
  Organization,
  ProfileResponse,
  UpdateUserInput,
  User,
} from './types';
import type {
  Allergy,
  Condition,
  Facility,
  Medication,
  Observation,
  Patient,
  PccCollection,
  PendingApiCall,
  ProgressNote,
  ProgressNoteType,
  SyncResult,
  WebhookLog,
  WebhookSubscription,
} from './pccTypes';

/** Result of a successful login: the JWT plus an optional user object if the
 *  backend returned one in the body. */
export interface LoginResult {
  token: string;
  user: AuthUser | null;
}

// Common places a JWT shows up in a login response body across backends.
const TOKEN_FIELDS = ['token', 'accessToken', 'access_token', 'jwt', 'id_token', 'idToken'];

function extractToken(body: unknown, response: Response): string | null {
  if (body && typeof body === 'object') {
    const obj = body as Record<string, unknown>;
    for (const key of TOKEN_FIELDS) {
      if (typeof obj[key] === 'string' && obj[key]) return obj[key] as string;
    }
    if (obj.data && typeof obj.data === 'object') {
      const nested = extractToken(obj.data, response);
      if (nested) return nested;
    }
  }
  const header = response.headers.get('authorization') ?? response.headers.get('Authorization');
  if (header) return header.replace(/^Bearer\s+/i, '').trim();
  return null;
}

/** Map the /auth/profile shape onto our AuthUser. */
function profileToUser(p: ProfileResponse): AuthUser {
  return {
    id: p.id,
    name: p.fullName || `${p.firstName} ${p.lastName}`.trim() || p.email,
    email: p.email,
    role: p.role,
    organizationId: p.organizationId,
  };
}

export const authApi = {
  /** POST /auth/login → extracts the JWT (from body `token` or Authorization header). */
  async login(email: string, password: string): Promise<LoginResult> {
    const { data, response } = await apiFetchWithResponse<unknown>('/auth/login', {
      method: 'POST',
      body: { email, password },
      skipAuth: true,
    });
    const token = extractToken(data, response);
    if (!token) {
      throw new Error('Login succeeded but no JWT was found in the response.');
    }
    // This backend returns { token, type, username } — no user object — so the
    // caller enriches identity from /auth/profile or the JWT claims.
    return { token, user: null };
  },

  /** GET /auth/profile → the currently authenticated user. */
  async me(): Promise<AuthUser> {
    const profile = await api.get<ProfileResponse>('/auth/profile');
    return profileToUser(profile);
  },
};

export const organizationsApi = {
  /** GET /syncare/organizations → all organizations. */
  list: () => api.get<Organization[]>('/syncare/organizations'),

  get: (id: string) => api.get<Organization>(`/syncare/organizations/${id}`),

  /** POST /syncare/organizations → create a new organization. */
  create: (data: CreateOrganizationInput) =>
    api.post<Organization>('/syncare/organizations', data),
};

export const appConfigApi = {
  /** GET /syncare/app-config/{id} → a runtime config document. */
  get: (id: string) => api.get<AppConfig>(`/syncare/app-config/${id}`),
};

export const usersApi = {
  /** GET /admin/users → all users. */
  list: () => api.get<User[]>('/admin/users'),

  /** POST /admin/user → create a user (RegisterRequest). */
  create: (data: CreateUserInput) => api.post<User>('/admin/user', data),

  // ── ASSUMED endpoints — no update/delete user endpoints exist in the API yet.
  // Wire-compatible with PUT/DELETE /admin/users/{id}; change here if the real
  // shapes differ once the backend adds them.
  /** PUT /admin/users/{id} → update a user. */
  update: (id: string, data: UpdateUserInput) => api.put<User>(`/admin/users/${id}`, data),

  /** DELETE /admin/users/{id} → delete a user. */
  remove: (id: string) => api.delete<void>(`/admin/users/${id}`),
};

// ══════════════════════════════════════════════════════════════════════════
// PointClickCare (PCC) integration. Every path is keyed by `orgUuid`, which is
// the organization's `pccOrgUuid`. `facId`, `patientId`, etc. are integers.
// GET endpoints read (from PCC or the local DB); POST endpoints trigger a sync.
// ══════════════════════════════════════════════════════════════════════════

export const facilitiesApi = {
  /** GET /syncare/{orgUuid}/facility → facilities for the org (from the local DB). */
  list: (orgUuid: string) => api.get<Facility[]>(`/syncare/${orgUuid}/facility`),

  /** POST /syncare/pcc/{orgUuid}/facility/sync → fetch + save all facilities from PCC. */
  syncAll: (orgUuid: string) => api.post<SyncResult>(`/syncare/pcc/${orgUuid}/facility/sync`),
};

export const patientsApi = {
  /** GET /syncare/{orgUuid}/patient/facility/{facId}/ → patients in a facility, from the local DB. */
  listByFacilityDb: (orgUuid: string, facId: number) =>
    api.get<Patient[]>(`/syncare/${orgUuid}/patient/facility/${facId}/`),

  /** GET /syncare/pcc/{orgUuid}/patients/facility/{facId} → patients live from PCC. */
  listByFacility: (
    orgUuid: string,
    facId: number,
    params?: { patientStatus?: string; page?: number; pageSize?: number },
  ) =>
    api.get<PccCollection<Patient>>(`/syncare/pcc/${orgUuid}/patients/facility/${facId}`, {
      params,
    }),

  /** GET /syncare/{orgUuid}/patient/{id}/ → a single patient from the local DB. */
  get: (orgUuid: string, patientId: number) =>
    api.get<Patient>(`/syncare/${orgUuid}/patient/${patientId}/`),

  /** POST /syncare/pcc/{orgUuid}/patients/facility/{facId}/sync */
  syncFacility: (
    orgUuid: string,
    facId: number,
    params?: { patientStatus?: string; page?: number; pageSize?: number },
  ) =>
    api.post<SyncResult>(`/syncare/pcc/${orgUuid}/patients/facility/${facId}/sync`, undefined, {
      params,
    }),

  /** POST /syncare/pcc/{orgUuid}/patient/{patientId}/sync */
  syncPatient: (orgUuid: string, patientId: number) =>
    api.post<Patient>(`/syncare/pcc/${orgUuid}/patient/${patientId}/sync`),
};

export const allergiesApi = {
  /** GET /syncare/allergies/{orgUuid}/patient/{patientId} → allergies from the DB. */
  fromDb: (orgUuid: string, patientId: number) =>
    api.get<Allergy[]>(`/syncare/allergies/${orgUuid}/patient/${patientId}`),

  /** POST /syncare/allergies/pcc/{orgUuid}/patient/{patientId}/sync */
  syncPatient: (orgUuid: string, patientId: number) =>
    api.post<SyncResult>(`/syncare/allergies/pcc/${orgUuid}/patient/${patientId}/sync`),

  /** POST /syncare/allergies/sync-all-allergies/{orgUuid}?patientStatus=… →
   *  sync allergies for every facility's patients in the org (optionally filtered
   *  by patient status). */
  syncAll: (orgUuid: string, params?: { patientStatus?: string }) =>
    api.post<SyncResult>(`/syncare/allergies/sync-all-allergies/${orgUuid}`, undefined, {
      params,
    }),

  /** POST /syncare/allergies/pcc/{orgUuid}/facility/{facId}/sync-all?patientStatus=…
   *  → sync allergies for every patient in a facility (optionally filtered by
   *  patient status). */
  syncFacility: (orgUuid: string, facId: number, params?: { patientStatus?: string }) =>
    api.post<SyncResult>(
      `/syncare/allergies/pcc/${orgUuid}/facility/${facId}/sync-all`,
      undefined,
      { params },
    ),
};

export const conditionsApi = {
  /** GET /syncare/pcc/conditions/{orgUuid}/patient/{patientId} → conditions from DB. */
  forPatient: (orgUuid: string, patientId: number, clinicalStatus?: string) =>
    api.get<Condition[]>(`/syncare/pcc/conditions/${orgUuid}/patient/${patientId}`, {
      params: { clinicalStatus },
    }),

  /** POST /syncare/pcc/conditions/{orgUuid}/patient/{patientId}/sync */
  syncPatient: (orgUuid: string, patientId: number) =>
    api.post<PccCollection<Condition>>(
      `/syncare/pcc/conditions/${orgUuid}/patient/${patientId}/sync`,
    ),

  /** POST /syncare/pcc/conditions/{orgUuid}/facility/{facId}/sync-all → sync
   *  conditions for every patient in a facility. */
  syncFacility: (orgUuid: string, facId: number) =>
    api.post<SyncResult>(`/syncare/pcc/conditions/${orgUuid}/facility/${facId}/sync-all`),
};

export const medicationsApi = {
  /** GET /syncare/pcc/{orgUuid}/medications/facility/{facId} → meds (optionally per patient). */
  byFacility: (
    orgUuid: string,
    facId: number,
    params?: { patientId?: number; status?: string; page?: number; pageSize?: number },
  ) =>
    api.get<PccCollection<Medication>>(`/syncare/pcc/${orgUuid}/medications/facility/${facId}`, {
      params,
    }),

  /** POST /syncare/pcc/{orgUuid}/medications/facility/{facId}/sync */
  syncFacility: (orgUuid: string, facId: number, params?: { patientId?: number }) =>
    api.post<SyncResult>(`/syncare/pcc/${orgUuid}/medications/facility/${facId}/sync`, undefined, {
      params,
    }),

  /** POST /syncare/pcc/{orgUuid}/medications/facility/{facId}/sync-all?patientStatus=…
   *  → sync medications for every patient in a facility (optionally filtered by
   *  patient status). */
  syncFacilityAll: (orgUuid: string, facId: number, params?: { patientStatus?: string }) =>
    api.post<SyncResult>(
      `/syncare/pcc/${orgUuid}/medications/facility/${facId}/sync-all`,
      undefined,
      { params },
    ),

  /** POST /syncare/pcc/{orgUuid}/medications/sync-all → sync every facility's
   *  medications for the org. `patientStatus` filters which patients are synced. */
  syncAll: (orgUuid: string, params?: { patientStatus?: string }) =>
    api.post<SyncResult>(`/syncare/pcc/${orgUuid}/medications/sync-all`, undefined, { params }),
};

export const observationsApi = {
  /** GET /syncare/pcc/{orgUuid}/observations/patient/{patientId} → observations. */
  byPatient: (orgUuid: string, patientId: number, latest = false) =>
    api.get<PccCollection<Observation>>(
      `/syncare/pcc/${orgUuid}/observations/patient/${patientId}`,
      { params: { latest } },
    ),

  /** POST /syncare/pcc/{orgUuid}/observations/patient/{patientId}/sync */
  syncPatient: (orgUuid: string, patientId: number) =>
    api.post<SyncResult>(`/syncare/pcc/${orgUuid}/observations/patient/${patientId}/sync`),

  /** POST /syncare/pcc/{orgUuid}/observations/sync-all → sync every facility's
   *  observations for the org. `patientStatus` filters which patients are synced;
   *  `latest` limits the sync to each patient's most recent observations. */
  syncAll: (orgUuid: string, params?: { patientStatus?: string; latest?: boolean }) =>
    api.post<SyncResult>(`/syncare/pcc/${orgUuid}/observations/sync-all`, undefined, { params }),

  /** POST /syncare/pcc/{orgUuid}/observations/facility/{facId}/sync-all → sync
   *  observations for every patient in a facility. */
  syncFacility: (
    orgUuid: string,
    facId: number,
    params?: { patientStatus?: string; latest?: boolean },
  ) =>
    api.post<SyncResult>(
      `/syncare/pcc/${orgUuid}/observations/facility/${facId}/sync-all`,
      undefined,
      { params },
    ),
};

export const progressNotesApi = {
  /** GET /syncare/{orgUuid}/progress-notes/patient/{patientId} → notes from DB. */
  byPatient: (orgUuid: string, patientId: number) =>
    api.get<ProgressNote[]>(`/syncare/${orgUuid}/progress-notes/patient/${patientId}`),

  /** GET /syncare/{orgUuid}/progress-note-types → note types from DB. */
  types: (orgUuid: string) =>
    api.get<ProgressNoteType[]>(`/syncare/${orgUuid}/progress-note-types`),

  /** POST /syncare/pcc/{orgUuid}/progress-note-types/facility/{facId}/sync → sync
   *  a facility's progress-note types from PCC. */
  syncTypesFacility: (orgUuid: string, facId: number) =>
    api.post<SyncResult>(
      `/syncare/pcc/${orgUuid}/progress-note-types/facility/${facId}/sync`,
    ),

  /** POST /syncare/{orgUuid}/pcc/progress-notes/sync-all → sync every facility's
   *  progress notes for the org. `patientStatus` filters which patients are
   *  synced; `startDate`/`endDate` bound the notes' date range. */
  syncAll: (
    orgUuid: string,
    params?: { patientStatus?: string; startDate?: string; endDate?: string },
  ) =>
    api.post<SyncResult>(`/syncare/${orgUuid}/pcc/progress-notes/sync-all`, undefined, { params }),

  /** POST /syncare/{orgUuid}/pcc/progress-notes/facility/{facId}/sync-all → sync
   *  progress notes for every patient in a facility. `patientStatus` filters which
   *  patients are synced; `startDate`/`endDate` bound the notes' date range. */
  syncFacility: (
    orgUuid: string,
    facId: number,
    params?: { patientStatus?: string; startDate?: string; endDate?: string },
  ) =>
    api.post<SyncResult>(
      `/syncare/${orgUuid}/pcc/progress-notes/facility/${facId}/sync-all`,
      undefined,
      { params },
    ),
};

export const webhooksApi = {
  /** GET /syncare/pcc/webhooks/subscriptions → the app's webhook subscriptions. */
  subscriptions: (applicationName = 'syncare') =>
    api.get<WebhookSubscription[]>('/syncare/pcc/webhooks/subscriptions', {
      params: { applicationName },
    }),

  /** GET /syncare/webhook-logs → stored webhook deliveries. All filters are
   *  optional and combinable (orgUuid, eventType, status, patientId, facId). */
  logs: (params?: {
    orgUuid?: string;
    eventType?: string;
    status?: string;
    patientId?: number;
    facId?: number;
  }) => api.get<WebhookLog[]>('/syncare/webhook-logs', { params }),
};

export const pendingApiCallsApi = {
  /** GET /syncare/pending-api-calls → PCC calls that failed and are queued for retry. */
  list: () => api.get<PendingApiCall[]>('/syncare/pending-api-calls'),
};
