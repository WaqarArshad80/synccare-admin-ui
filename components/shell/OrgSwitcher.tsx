'use client';

import { useOrg } from '@/lib/orgContext';

/** Active-organization picker shown in the sidebar. Drives every PCC screen. */
export function OrgSwitcher() {
  const { orgs, org, loading, error, selectOrg } = useOrg();

  return (
    <div className="org-switcher">
      <label htmlFor="org-switch" className="org-switcher-label">
        Organization
      </label>
      {error ? (
        <div className="org-switcher-error">{error}</div>
      ) : (
        <select
          id="org-switch"
          className="org-switcher-select"
          value={org?.id ?? ''}
          disabled={loading || orgs.length === 0}
          onChange={(e) => selectOrg(e.target.value)}
        >
          {loading && <option value="">Loading…</option>}
          {!loading && orgs.length === 0 && <option value="">No organizations</option>}
          {orgs.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
