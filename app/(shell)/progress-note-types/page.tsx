'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Topbar } from '@/components/shell/Topbar';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { SyncButton } from '@/components/pcc/SyncButton';
import { useOrg } from '@/lib/orgContext';
import { useApi } from '@/lib/useApi';
import { facilitiesApi, progressNotesApi } from '@/lib/endpoints';
import type { ProgressNoteType } from '@/lib/pccTypes';

function yesNo(v?: boolean): string {
  return v === undefined ? '—' : v ? 'Yes' : 'No';
}

export default function ProgressNoteTypesPage() {
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

  // Note types come from the local DB (org-scoped); we filter to the selected
  // facility client-side. Refetched after a sync.
  const typesFetcher = useCallback(
    () => (orgUuid ? progressNotesApi.types(orgUuid) : Promise.resolve<ProgressNoteType[]>([])),
    [orgUuid],
  );
  const { data, loading, error, refetch } = useApi(typesFetcher, [orgUuid]);
  const types = (data ?? []).filter((t) => facId == null || t.facId === facId);

  return (
    <>
      <Topbar
        title="Note Types"
        crumbs={[{ label: 'PCC' }]}
        actions={
          orgUuid &&
          facId != null && (
            <SyncButton
              label="Sync from PCC"
              variant="primary"
              run={() => progressNotesApi.syncTypesFacility(orgUuid, facId)}
              onDone={refetch}
            />
          )
        }
      />
      <main className="content">
        {/* Org + facility pickers → POST /syncare/pcc/{orgUuid}/progress-note-types/facility/{facId}/sync. */}
        <div className="toolbar">
          <div className="field" style={{ minWidth: 240 }}>
            <label htmlFor="pnt-org">Organization</label>
            <select
              id="pnt-org"
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
            <label htmlFor="pnt-fac">Facility</label>
            <select
              id="pnt-fac"
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
          <div className="state">Select an organization to view its note types.</div>
        ) : facId == null ? (
          <div className="state">Choose a facility to view its note types.</div>
        ) : loading ? (
          <div className="state">Loading note types…</div>
        ) : error ? (
          <div className="state">
            <p style={{ margin: '0 0 var(--space-3)' }}>{error}</p>
            <Button variant="secondary" onClick={refetch}>
              Try again
            </Button>
          </div>
        ) : types.length === 0 ? (
          <div className="state">No note types found for this facility. Try “Sync from PCC”.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Note type</th>
                <th>Type ID</th>
                <th>High priority</th>
                <th>On shift report</th>
                <th>On 24-hour report</th>
              </tr>
            </thead>
            <tbody>
              {types.map((t) => (
                <tr key={t.progressNoteTypeId ?? t.noteType}>
                  <td>{t.noteType ?? '—'}</td>
                  <td className="text-muted">{t.progressNoteTypeId ?? '—'}</td>
                  <td>{t.highPriority ? <Tag tone="accent">Yes</Tag> : <span className="text-muted">No</span>}</td>
                  <td className="text-muted">{yesNo(t.showOnShiftReport)}</td>
                  <td className="text-muted">{yesNo(t.showOn24HourReport)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </>
  );
}
