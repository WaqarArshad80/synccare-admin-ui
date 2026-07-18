'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Topbar } from '@/components/shell/Topbar';
import { SyncButton } from '@/components/pcc/SyncButton';
import { useOrg } from '@/lib/orgContext';
import { useApi } from '@/lib/useApi';
import { allergiesApi, facilitiesApi } from '@/lib/endpoints';

// Values the sync endpoints accept for their ?patientStatus filter.
const PATIENT_STATUSES = ['Current', 'New', 'Discharged'];

export default function AllergiesPage() {
  const { orgs, org, orgUuid, loading: orgsLoading, selectOrg } = useOrg();
  // patientStatus filters which patients get their allergies synced. Sent as the
  // ?patientStatus query param on the sync endpoints.
  const [patientStatus, setPatientStatus] = useState('Current');
  const [facId, setFacId] = useState<number | null>(null);

  // Facilities for the selected org — reloads whenever the org changes.
  const facFetcher = useCallback(
    () => (orgUuid ? facilitiesApi.list(orgUuid) : Promise.resolve([])),
    [orgUuid],
  );
  const { data: facilities, loading: facLoading } = useApi(facFetcher, [orgUuid]);

  // When the org changes, clear the facility so it re-defaults to the new org's
  // first facility (the previous facId belongs to a different org).
  const prevOrgUuid = useRef(orgUuid);
  useEffect(() => {
    if (prevOrgUuid.current !== null && prevOrgUuid.current !== orgUuid) setFacId(null);
    prevOrgUuid.current = orgUuid;
  }, [orgUuid]);

  // Default to the first facility once loaded, if none chosen.
  useEffect(() => {
    if (facId == null && facilities && facilities.length > 0) setFacId(facilities[0].facId);
  }, [facilities, facId]);

  return (
    <>
      <Topbar
        title="Allergies"
        crumbs={[{ label: 'PCC' }]}
        actions={
          orgUuid && (
            <span style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
              {facId != null && (
                <SyncButton
                  label="Sync facility from PCC"
                  variant="primary"
                  run={() => allergiesApi.syncFacility(orgUuid, facId, { patientStatus })}
                />
              )}
              <SyncButton
                label="Sync all facilities"
                variant="secondary"
                run={() => allergiesApi.syncAll(orgUuid, { patientStatus })}
              />
            </span>
          )
        }
      />
      <main className="content">
        {/* Org + facility pickers. The facility sync maps into {orgUuid}/{facId} for
            POST /syncare/allergies/pcc/{orgUuid}/facility/{facId}/sync-all; the
            org-wide sync hits POST /syncare/allergies/sync-all-allergies/{orgUuid}. */}
        <div className="toolbar">
          <div className="field" style={{ minWidth: 240 }}>
            <label htmlFor="alg-org">Organization</label>
            <select
              id="alg-org"
              className="input"
              value={org?.id ?? ''}
              disabled={orgsLoading || orgs.length === 0}
              onChange={(e) => selectOrg(e.target.value)}
            >
              <option value="" disabled>
                {orgsLoading ? 'Loading…' : 'Select an organization…'}
              </option>
              {orgs.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ minWidth: 240 }}>
            <label htmlFor="alg-fac">Facility (for facility sync)</label>
            <select
              id="alg-fac"
              className="input"
              value={facId ?? ''}
              disabled={!orgUuid || facLoading}
              onChange={(e) => setFacId(e.target.value ? Number(e.target.value) : null)}
            >
              <option value="" disabled>
                {!orgUuid
                  ? 'Select an organization first'
                  : facLoading
                    ? 'Loading facilities…'
                    : (facilities ?? []).length === 0
                      ? 'No facilities — sync them first'
                      : 'Select a facility…'}
              </option>
              {(facilities ?? []).map((f) => (
                <option key={f.facId} value={f.facId}>
                  {f.facilityName} (#{f.facId})
                </option>
              ))}
            </select>
          </div>

          <div className="field" style={{ minWidth: 160 }}>
            <label htmlFor="alg-status">Patient status (for sync)</label>
            <select
              id="alg-status"
              className="input"
              value={patientStatus}
              onChange={(e) => setPatientStatus(e.target.value)}
            >
              {PATIENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {orgUuid && (
            <span className="sync-note" style={{ alignSelf: 'end', paddingBottom: 8 }}>
              orgUuid = <code>{orgUuid}</code>
              {facId != null && (
                <>
                  {' · '}facId = <code>{facId}</code>
                </>
              )}
            </span>
          )}
        </div>

        {!orgUuid ? (
          <div className="state">Select an organization to sync its allergies.</div>
        ) : (
          <div className="state">
            <strong>Sync facility</strong> pulls allergies for every patient in the
            selected facility. <strong>Sync all facilities</strong> pulls them for the
            whole organization (patient status <code>{patientStatus}</code>).
          </div>
        )}
      </main>
    </>
  );
}
