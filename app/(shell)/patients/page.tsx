'use client';

import { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Topbar } from '@/components/shell/Topbar';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { SyncButton } from '@/components/pcc/SyncButton';
import { useOrg } from '@/lib/orgContext';
import { useApi } from '@/lib/useApi';
import { facilitiesApi, patientsApi } from '@/lib/endpoints';
import { formatDate } from '@/lib/format';
import type { Patient } from '@/lib/pccTypes';

const STATUSES = ['Current', 'Discharged', 'New', 'Leave'];

function PatientsInner() {
  const { orgs, org, orgUuid, loading: orgsLoading, selectOrg } = useOrg();
  const params = useSearchParams();
  const facIdParam = params.get('facId');

  const [facId, setFacId] = useState<number | null>(facIdParam ? Number(facIdParam) : null);
  const [status, setStatus] = useState('Current');

  // Facilities for the selected org — reloads whenever the org changes.
  const facFetcher = useCallback(
    () => (orgUuid ? facilitiesApi.list(orgUuid) : Promise.resolve([])),
    [orgUuid],
  );
  const { data: facilities, loading: facLoading } = useApi(facFetcher, [orgUuid]);

  // When the org actually changes, clear the facility so it re-defaults to the
  // new org's first facility (the previous facId belongs to a different org).
  const prevOrgUuid = useRef(orgUuid);
  useEffect(() => {
    if (prevOrgUuid.current !== null && prevOrgUuid.current !== orgUuid) setFacId(null);
    prevOrgUuid.current = orgUuid;
  }, [orgUuid]);

  // Default to the first facility once loaded, if none chosen.
  useEffect(() => {
    if (facId == null && facilities && facilities.length > 0) setFacId(facilities[0].facId);
  }, [facilities, facId]);

  // Patients come from the local DB, keyed by org + facility. The `status`
  // selector only parameterizes the PCC sync below, not this list.
  const patFetcher = useCallback(
    () =>
      orgUuid && facId != null
        ? patientsApi.listByFacilityDb(orgUuid, facId)
        : Promise.resolve<Patient[]>([]),
    [orgUuid, facId],
  );
  const { data, loading, error, refetch } = useApi(patFetcher, [orgUuid, facId]);
  const patients = data ?? [];

  return (
    <>
      <Topbar
        title="Patients"
        crumbs={[{ label: 'PCC' }]}
        actions={
          orgUuid && facId != null ? (
            <SyncButton
              label="Sync patients from PCC"
              variant="primary"
              run={() => patientsApi.syncFacility(orgUuid, facId, { patientStatus: status })}
              onDone={refetch}
            />
          ) : null
        }
      />
      <main className="content">
        <div className="toolbar">
          {/* Organization — selecting one loads its facilities below. */}
          <div className="field" style={{ minWidth: 240 }}>
            <label htmlFor="pat-org">Organization</label>
            <select
              id="pat-org"
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
            <label htmlFor="fac">Facility</label>
            <select
              id="fac"
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
            <label htmlFor="status">Status (for sync)</label>
            <select
              id="status"
              className="input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!orgUuid ? (
          <div className="state">Select an organization to view patients.</div>
        ) : (
          <>
            {facId == null && <div className="state">Choose a facility to load patients.</div>}
            {facId != null && loading && <div className="state">Loading patients…</div>}
            {facId != null && error && !loading && (
              <div className="state">
                <p style={{ margin: '0 0 var(--space-3)' }}>{error}</p>
                <Button variant="secondary" onClick={refetch}>
                  Try again
                </Button>
              </div>
            )}
            {facId != null && !loading && !error && patients.length === 0 && (
              <div className="state">No patients found. Try syncing from PCC.</div>
            )}
            {facId != null && !loading && !error && patients.length > 0 && (
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Patient ID</th>
                    <th>Gender</th>
                    <th>DOB</th>
                    <th>Room</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Clinical</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.map((p) => (
                    <tr key={p.patientId}>
                      <td>{[p.firstName, p.lastName].filter(Boolean).join(' ') || '—'}</td>
                      <td className="text-muted">{p.patientId}</td>
                      <td className="text-muted">{p.gender ?? '—'}</td>
                      <td className="text-muted">{formatDate(p.birthDate)}</td>
                      <td className="text-muted">{p.roomDesc ?? '—'}</td>
                      <td>
                        <Tag tone="neutral">{p.patientStatus ?? status}</Tag>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link href={`/patients/${p.patientId}?facId=${p.facId ?? facId}`}>
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="text-muted" style={{ fontSize: 12 }}>
              Patients for <strong>{org?.name}</strong> from the local database. Use “Sync patients from PCC” to refresh from PointClickCare.
            </p>
          </>
        )}
      </main>
    </>
  );
}

export default function PatientsPage() {
  return (
    <Suspense fallback={null}>
      <PatientsInner />
    </Suspense>
  );
}
