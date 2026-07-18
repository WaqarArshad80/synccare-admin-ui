'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Topbar } from '@/components/shell/Topbar';
import { SyncButton } from '@/components/pcc/SyncButton';
import { useOrg } from '@/lib/orgContext';
import { useApi } from '@/lib/useApi';
import { facilitiesApi, progressNotesApi } from '@/lib/endpoints';

// Values the sync endpoints accept for their ?patientStatus filter.
const PATIENT_STATUSES = ['Current', 'New', 'Discharged'];

// The backend expects dates as YYYY-MM-DD. `<input type="date">` already emits
// that, but normalize defensively (some browsers fall back to a text input) and
// build from local parts so we never tz-shift a day.
function toYmd(value: string): string | undefined {
  if (!value) return undefined;
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return iso[0];
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return undefined;
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mo}-${day}`;
}

export default function ProgressNotesPage() {
  const { orgs, org, orgUuid, loading: orgsLoading, selectOrg } = useOrg();
  // patientStatus filters which patients get their notes synced; startDate/
  // endDate bound the note date range. All sent as query params on the sync
  // endpoints.
  const [patientStatus, setPatientStatus] = useState('Current');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
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

  const syncParams = () => ({
    patientStatus,
    startDate: toYmd(startDate),
    endDate: toYmd(endDate),
  });

  return (
    <>
      <Topbar
        title="Progress Notes"
        crumbs={[{ label: 'PCC' }]}
        actions={
          orgUuid && (
            <span style={{ display: 'inline-flex', gap: 'var(--space-2)' }}>
              {facId != null && (
                <SyncButton
                  label="Sync facility from PCC"
                  variant="primary"
                  run={() => progressNotesApi.syncFacility(orgUuid, facId, syncParams())}
                />
              )}
              <SyncButton
                label="Sync all facilities"
                variant="secondary"
                run={() => progressNotesApi.syncAll(orgUuid, syncParams())}
              />
            </span>
          )
        }
      />
      <main className="content">
        {/* Org + facility pickers. The facility sync maps into {orgUuid}/{facId} for
            POST /syncare/{orgUuid}/pcc/progress-notes/facility/{facId}/sync-all; the
            org-wide sync hits POST /syncare/{orgUuid}/pcc/progress-notes/sync-all. */}
        <div className="toolbar">
          <div className="field" style={{ minWidth: 240 }}>
            <label htmlFor="pn-org">Organization</label>
            <select
              id="pn-org"
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
            <label htmlFor="pn-fac">Facility (for facility sync)</label>
            <select
              id="pn-fac"
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
            <label htmlFor="pn-status">Patient status (for sync)</label>
            <select
              id="pn-status"
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

          <div className="field">
            <label htmlFor="pn-start">Start date</label>
            <input
              id="pn-start"
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="pn-end">End date</label>
            <input
              id="pn-end"
              type="date"
              className="input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
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
          <div className="state">Select an organization to sync its progress notes.</div>
        ) : (
          <div className="state">
            <strong>Sync facility</strong> pulls progress notes for every patient in the
            selected facility. <strong>Sync all facilities</strong> pulls them for the
            whole organization (patient status <code>{patientStatus}</code>
            {startDate ? <>, from <code>{startDate}</code></> : null}
            {endDate ? <> to <code>{endDate}</code></> : null}).
          </div>
        )}
      </main>
    </>
  );
}
