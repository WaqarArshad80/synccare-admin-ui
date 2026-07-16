'use client';

// Per-patient clinical data tabs used by the patient detail page. Each fetches
// its own data from the local DB (or PCC) and offers a Sync action.

import { useCallback } from 'react';
import { Tag } from '@/components/ui/Tag';
import { SyncButton } from '@/components/pcc/SyncButton';
import { AsyncState } from '@/components/pcc/AsyncState';
import { useApi } from '@/lib/useApi';
import { formatDate } from '@/lib/format';
import {
  allergiesApi,
  conditionsApi,
  medicationsApi,
  observationsApi,
  progressNotesApi,
} from '@/lib/endpoints';

interface TabProps {
  orgUuid: string;
  patientId: number;
  facId: number | null;
}

function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="toolbar">{children}</div>;
}

export function AllergiesTab({ orgUuid, patientId }: TabProps) {
  const fetcher = useCallback(() => allergiesApi.fromDb(orgUuid, patientId), [orgUuid, patientId]);
  const { data, loading, error, refetch } = useApi(fetcher, [orgUuid, patientId]);
  const rows = data ?? [];
  return (
    <>
      <Toolbar>
        <SyncButton
          label="Sync allergies from PCC"
          run={() => allergiesApi.syncPatient(orgUuid, patientId)}
          onDone={refetch}
        />
      </Toolbar>
      <AsyncState loading={loading} error={error} empty={rows.length === 0} onRetry={refetch} emptyText="No allergies. Sync from PCC to load them.">
        <table className="table">
          <thead>
            <tr><th>Allergen</th><th>Type</th><th>Category</th><th>Status</th><th>Severity</th><th>Reaction</th><th>Onset</th></tr>
          </thead>
          <tbody>
            {rows.map((a, i) => (
              <tr key={a.allergyIntoleranceId ?? i}>
                <td>{a.allergen ?? '—'}</td>
                <td className="text-muted">{a.type ?? '—'}</td>
                <td className="text-muted">{a.category ?? '—'}</td>
                <td><Tag tone={a.clinicalStatus === 'active' ? 'accent' : 'neutral'}>{a.clinicalStatus ?? '—'}</Tag></td>
                <td className="text-muted">{a.severity ?? '—'}</td>
                <td className="text-muted">{a.reactionType ?? '—'}</td>
                <td className="text-muted">{formatDate(a.onsetDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AsyncState>
    </>
  );
}

export function ConditionsTab({ orgUuid, patientId }: TabProps) {
  const fetcher = useCallback(() => conditionsApi.forPatient(orgUuid, patientId), [orgUuid, patientId]);
  const { data, loading, error, refetch } = useApi(fetcher, [orgUuid, patientId]);
  const rows = data ?? [];
  return (
    <>
      <Toolbar>
        <SyncButton
          label="Sync conditions from PCC"
          run={() => conditionsApi.syncPatient(orgUuid, patientId)}
          onDone={refetch}
        />
      </Toolbar>
      <AsyncState loading={loading} error={error} empty={rows.length === 0} onRetry={refetch} emptyText="No conditions. Sync from PCC to load them.">
        <table className="table">
          <thead>
            <tr><th>ICD-10</th><th>Description</th><th>Status</th><th>Rank</th><th>Principal</th><th>Onset</th><th>Resolved</th></tr>
          </thead>
          <tbody>
            {rows.map((c, i) => (
              <tr key={c.conditionId ?? i}>
                <td>{c.icd10 ?? '—'}</td>
                <td>{c.icd10Description ?? '—'}</td>
                <td><Tag tone={c.clinicalStatus === 'active' ? 'accent' : 'neutral'}>{c.clinicalStatus ?? '—'}</Tag></td>
                <td className="text-muted">{c.rankDescription ?? '—'}</td>
                <td className="text-muted">{c.principalDiagnosis ? 'Yes' : '—'}</td>
                <td className="text-muted">{formatDate(c.onsetDate)}</td>
                <td className="text-muted">{formatDate(c.resolvedDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AsyncState>
    </>
  );
}

export function MedicationsTab({ orgUuid, patientId, facId }: TabProps) {
  const fetcher = useCallback(
    () =>
      facId != null
        ? medicationsApi.byFacility(orgUuid, facId, { patientId })
        : Promise.resolve({ data: [] }),
    [orgUuid, facId, patientId],
  );
  const { data, loading, error, refetch } = useApi(fetcher, [orgUuid, facId, patientId]);
  const rows = data?.data ?? [];
  if (facId == null)
    return <div className="state">Facility unknown for this patient — open the patient from the Patients list so medications can load.</div>;
  return (
    <>
      <Toolbar>
        <SyncButton
          label="Sync medications from PCC"
          run={() => medicationsApi.syncFacility(orgUuid, facId, { patientId })}
          onDone={refetch}
        />
      </Toolbar>
      <AsyncState loading={loading} error={error} empty={rows.length === 0} onRetry={refetch} emptyText="No medications. Sync from PCC to load them.">
        <table className="table">
          <thead>
            <tr><th>Description</th><th>Generic</th><th>Strength</th><th>Directions</th><th>Status</th><th>Start</th><th>End</th></tr>
          </thead>
          <tbody>
            {rows.map((m, i) => (
              <tr key={m.orderId ?? i}>
                <td>{m.description ?? '—'}</td>
                <td className="text-muted">{m.generic ?? '—'}</td>
                <td className="text-muted">{[m.strength, m.strengthUOM].filter(Boolean).join(' ') || '—'}</td>
                <td className="text-muted">{m.directions ?? '—'}</td>
                <td><Tag tone={m.status === 'Active' ? 'accent' : 'neutral'}>{m.status ?? '—'}</Tag></td>
                <td className="text-muted">{formatDate(m.startDate)}</td>
                <td className="text-muted">{formatDate(m.endDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AsyncState>
    </>
  );
}

export function ObservationsTab({ orgUuid, patientId }: TabProps) {
  const fetcher = useCallback(() => observationsApi.byPatient(orgUuid, patientId), [orgUuid, patientId]);
  const { data, loading, error, refetch } = useApi(fetcher, [orgUuid, patientId]);
  const rows = data?.data ?? [];
  const renderValue = (o: (typeof rows)[number]) => {
    if (o.systolicValue != null || o.diastolicValue != null)
      return `${o.systolicValue ?? '?'}/${o.diastolicValue ?? '?'} ${o.unit ?? ''}`.trim();
    if (o.value != null) return `${o.value} ${o.unit ?? ''}`.trim();
    return '—';
  };
  return (
    <>
      <Toolbar>
        <SyncButton
          label="Sync observations from PCC"
          run={() => observationsApi.syncPatient(orgUuid, patientId)}
          onDone={refetch}
        />
      </Toolbar>
      <AsyncState loading={loading} error={error} empty={rows.length === 0} onRetry={refetch} emptyText="No observations. Sync from PCC to load them.">
        <table className="table">
          <thead>
            <tr><th>Type</th><th>Value</th><th>Method</th><th>Recorded</th><th>By</th></tr>
          </thead>
          <tbody>
            {rows.map((o, i) => (
              <tr key={o.observationId ?? i}>
                <td>{o.type ?? '—'}</td>
                <td>{renderValue(o)}</td>
                <td className="text-muted">{o.method ?? '—'}</td>
                <td className="text-muted">{formatDate(o.recordedDate)}</td>
                <td className="text-muted">{o.recordedBy ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AsyncState>
    </>
  );
}

export function ProgressNotesTab({ orgUuid, patientId }: TabProps) {
  const fetcher = useCallback(() => progressNotesApi.byPatient(orgUuid, patientId), [orgUuid, patientId]);
  const { data, loading, error, refetch } = useApi(fetcher, [orgUuid, patientId]);
  const rows = data ?? [];
  return (
    <>
      <Toolbar>
        <span className="sync-note">Progress notes sync in bulk from the Progress Notes admin job.</span>
      </Toolbar>
      <AsyncState loading={loading} error={error} empty={rows.length === 0} onRetry={refetch} emptyText="No progress notes stored for this patient.">
        <table className="table">
          <thead>
            <tr><th>Note type</th><th>Effective</th><th>Focus</th><th>Created by</th><th>Created</th></tr>
          </thead>
          <tbody>
            {rows.map((n, i) => (
              <tr key={n.id ?? n.progressNoteId ?? i}>
                <td>{n.noteType ?? n.progressNoteType ?? '—'}</td>
                <td className="text-muted">{formatDate(n.effectiveDate)}</td>
                <td className="text-muted">{n.focus ?? '—'}</td>
                <td className="text-muted">{n.createdBy ?? '—'}</td>
                <td className="text-muted">{formatDate(n.createdDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </AsyncState>
    </>
  );
}
