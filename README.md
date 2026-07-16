# SynCare Admin UI

Next.js (App Router, TypeScript) admin console built on the **Modernist** design
system. The design system's original HTML reference lives in [`Modernist/`](./Modernist);
this app ports its tokens and components to React.

## Getting started

```bash
npm install
cp .env.local.example .env.local   # then set NEXT_PUBLIC_API_BASE_URL
npm run dev                        # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run typecheck`.

## How it's wired

- **Design system** — tokens and component classes are ported into
  [`app/globals.css`](./app/globals.css) from `Modernist/styles.css`. Retune the look
  by editing the `:root` variables there. React wrappers for the common bits live in
  [`components/ui/`](./components/ui) (`Button`, `Tag`) and [`components/shell/`](./components/shell).

- **Admin shell** — the sidebar + topbar frame is [`app/(shell)/layout.tsx`](./app/(shell)/layout.tsx).
  Each page renders its own `<Topbar/>` (crumbs + actions) followed by its content.

- **API client** — [`lib/api.ts`](./lib/api.ts) is a typed `fetch` wrapper that prefixes
  every request with `NEXT_PUBLIC_API_BASE_URL` and attaches the JWT bearer token.
  Named endpoints live in [`lib/endpoints.ts`](./lib/endpoints.ts); adjust paths and the
  types in [`lib/types.ts`](./lib/types.ts) to match your backend.

- **CORS / API proxy** — the backend does not send CORS headers, so the browser can't call
  it cross-origin. Instead the client calls the same-origin prefix `/backend`
  (`NEXT_PUBLIC_API_BASE_URL=/backend`), and Next.js rewrites `/backend/*` to
  `API_PROXY_TARGET` (see [`next.config.mjs`](./next.config.mjs)) — requests stay
  same-origin and CORS never applies. The `/backend` path is excluded from the auth
  middleware so the login POST isn't gated. If your backend sends proper CORS headers you
  can instead point `NEXT_PUBLIC_API_BASE_URL` straight at its absolute URL and drop the
  rewrite.

- **Auth (JWT bearer)** — login posts to `/auth/login`, which returns
  `{ token, type, username }`. The token is stored in `localStorage` (read by the API
  client) and mirrored to a cookie so the edge [`middleware.ts`](./middleware.ts) can
  redirect unauthenticated users to `/login`. `AuthProvider`
  ([`lib/auth.tsx`](./lib/auth.tsx)) resolves the signed-in user from `GET /auth/profile`,
  enriched with the `organizationId` + `permissions` that only live in the JWT claims
  (decoded in [`lib/jwt.ts`](./lib/jwt.ts)) — so identity works even where the profile
  endpoint is unavailable. A `401` on any request clears the token and bounces to login;
  an expired `exp` is dropped on load.

## Backend — PCC Integration Service

Base URL `http://localhost:4080` (set `NEXT_PUBLIC_API_BASE_URL`). Endpoints the app uses:

| Endpoint | Method | Returns |
| --- | --- | --- |
| `/auth/login` | POST `{ email, password }` | `{ token, type, username }` |
| `/auth/profile` | GET | `{ id, email, firstName, lastName, fullName, role, organizationId, … }` |
| `/organizations` | GET · POST | `Organization[]` · `Organization` |
| `/admin/users` | GET | `User[]` |
| `/admin/user` | POST `RegisterRequest` | `User` |
| `/admin/users/{id}` | PUT · DELETE | **assumed — not in the API yet** (see below) |

### Users module — CRUD status

`GET /admin/users` (list) and `POST /admin/users` (create) are real and wired. The
create body (`RegisterRequest`) requires `email, password, firstName, lastName,
organizationId`; `role` is optional and restricted to `doctor|nurse`.

**Update and Delete have no backend endpoints yet.** The UI (Edit / Delete row actions) is
built against **assumed** `PUT /admin/users/{id}` and `DELETE /admin/users/{id}` in
`usersApi` — they currently return `404` and will start working once the backend adds them
(adjust the shapes in [`lib/endpoints.ts`](./lib/endpoints.ts) if they differ). There is
also **no `status` field** on users, so no status flag is shown — add it here and in
`lib/types.ts` once the backend exposes one.

Most clinical data (facilities, patients, allergies, conditions, medications, observations,
progress notes) lives under `/syncare/**` keyed by an organization's `pccOrgUuid`. See the
service's OpenAPI at `GET /api-docs` (auth-gated) for the full surface, and add new
functions to [`lib/endpoints.ts`](./lib/endpoints.ts).

## Building more pages

The **Organizations** page
([`app/(shell)/organizations/page.tsx`](./app/(shell)/organizations/page.tsx)) is the live
reference: it fetches through `organizationsApi` with the `useApi` hook and renders
loading / error / empty / data states with the Modernist table and tags.

## PCC screens

Every PointClickCare endpoint is keyed by `orgUuid` = the organization's `pccOrgUuid`. The
active organization is chosen in the sidebar **OrgSwitcher** ([`lib/orgContext.tsx`](./lib/orgContext.tsx),
persisted in localStorage) and read by every PCC screen via `useOrg()`. The flow is
**Facilities → Patients → Patient detail**:

- **Facilities** (`/facilities`) — `facilitiesApi.list(orgUuid)` + "Sync from PCC".
- **Patients** (`/patients`) — facility + status pickers, `patientsApi.listByFacility(...)` +
  sync. Rows open the patient detail (carry `facId` in the query for medications).
- **Patient detail** (`/patients/[patientId]`) — tabs for **Allergies, Conditions,
  Medications, Observations, Progress Notes** ([`components/pcc/clinicalTabs.tsx`](./components/pcc/clinicalTabs.tsx)),
  each a list from the local DB/PCC with a `SyncButton` that POSTs the corresponding sync.

Endpoint functions live in [`lib/endpoints.ts`](./lib/endpoints.ts) (`facilitiesApi`,
`patientsApi`, `allergiesApi`, `conditionsApi`, `medicationsApi`, `observationsApi`,
`progressNotesApi`); PCC payload types are in [`lib/pccTypes.ts`](./lib/pccTypes.ts).

> For heavier data-fetching needs, swap the minimal `lib/useApi.ts` hook for
> [TanStack Query](https://tanstack.com/query); the API client layer stays the same.
# syncare-admin-ui
# syncare-admin-ui
# syncare-admin-ui
