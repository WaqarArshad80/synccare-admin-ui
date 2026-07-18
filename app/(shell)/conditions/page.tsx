'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Topbar } from '@/components/shell/Topbar';
import { SyncButton } from '@/components/pcc/SyncButton';
import { useOrg } from '@/lib/orgContext';
import { useApi } from '@/lib/useApi';
import { conditionsApi, facilitiesApi } from '@/lib/endpoints';

export default function ConditionsPage() {
  const { orgs, org, orgUuid, loading: orgsLoading, selectOrg } = useOrg();
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
        title="Conditions"
        crumbs={[{ label: 'PCC' }]}
        actions={
          orgUuid &&
          facId != null && (
            <SyncButton
              label="Sync all from PCC"
              variant="primary"
              run={() => conditionsApi.syncFacility(orgUuid, facId)}
            />
          )
        }
      />
      <main className="content">
        {/* Org + facility pickers — mapped into {orgUuid} and {facId} for
            POST /syncare/pcc/conditions/{orgUuid}/facility/{facId}/sync-all. */}
        <div className="toolbar">
          <div className="field" style={{ minWidth: 240 }}>
            <label htmlFor="cond-org">Organization</label>
            <select
              id="cond-org"
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
            <label htmlFor="cond-fac">Facility</label>
            <select
              id="cond-fac"
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

          {orgUuid && facId != null && (
            <span className="sync-note" style={{ alignSelf: 'end', paddingBottom: 8 }}>
              orgUuid = <code>{orgUuid}</code> · facId = <code>{facId}</code>
            </span>
          )}
        </div>

        {!orgUuid ? (
          <div className="state">Select an organization to sync its conditions.</div>
        ) : facId == null ? (
          <div className="state">Choose a facility to sync its conditions.</div>
        ) : (
          <div className="state">
            Use “Sync all from PCC” to pull conditions for every patient in this
            facility.
          </div>
        )}
      </main>
    </>
  );
}
