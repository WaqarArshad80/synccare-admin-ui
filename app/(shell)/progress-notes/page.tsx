'use client';

import { useState } from 'react';
import { Topbar } from '@/components/shell/Topbar';
import { SyncButton } from '@/components/pcc/SyncButton';
import { useOrg } from '@/lib/orgContext';
import { progressNotesApi } from '@/lib/endpoints';

// Values the sync-all endpoint accepts for its ?patientStatus filter.
const PATIENT_STATUSES = ['Current', 'New', 'Discharged'];

export default function ProgressNotesPage() {
  const { orgs, org, orgUuid, loading: orgsLoading, selectOrg } = useOrg();
  // patientStatus filters which patients get their notes synced; startDate/
  // endDate bound the note date range. All sent as query params on
  // POST /syncare/{orgUuid}/pcc/progress-notes/sync-all.
  const [patientStatus, setPatientStatus] = useState('Current');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  return (
    <>
      <Topbar
        title="Progress Notes"
        crumbs={[{ label: 'PCC' }]}
        actions={
          orgUuid && (
            <SyncButton
              label="Sync all from PCC"
              variant="primary"
              run={() =>
                progressNotesApi.syncAll(orgUuid, {
                  patientStatus,
                  startDate: startDate || undefined,
                  endDate: endDate || undefined,
                })
              }
            />
          )
        }
      />
      <main className="content">
        {/* Organization picker — its pccOrgUuid is mapped into {orgUuid} for
            POST /syncare/{orgUuid}/pcc/progress-notes/sync-all. */}
        <div className="toolbar">
          <div className="field" style={{ minWidth: 260 }}>
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
            </span>
          )}
        </div>

        {!orgUuid ? (
          <div className="state">Select an organization to sync its progress notes.</div>
        ) : (
          <div className="state">
            Use “Sync all from PCC” to pull every facility&apos;s progress notes for this
            organization (patient status <code>{patientStatus}</code>
            {startDate ? <>, from <code>{startDate}</code></> : null}
            {endDate ? <> to <code>{endDate}</code></> : null}).
          </div>
        )}
      </main>
    </>
  );
}
