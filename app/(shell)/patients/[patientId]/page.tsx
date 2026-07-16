'use client';

import { Suspense, useCallback, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Topbar } from '@/components/shell/Topbar';
import { SyncButton } from '@/components/pcc/SyncButton';
import { useOrg } from '@/lib/orgContext';
import { useApi } from '@/lib/useApi';
import { patientsApi } from '@/lib/endpoints';
import { formatDate } from '@/lib/format';
import {
  AllergiesTab,
  ConditionsTab,
  MedicationsTab,
  ObservationsTab,
  ProgressNotesTab,
} from '@/components/pcc/clinicalTabs';

const TABS = ['Overview', 'Allergies', 'Conditions', 'Medications', 'Observations', 'Progress Notes'] as const;
type TabName = (typeof TABS)[number];

function PatientDetailInner() {
  const { orgUuid, org } = useOrg();
  const routeParams = useParams();
  const search = useSearchParams();
  const patientId = Number(routeParams.patientId);
  const facIdParam = search.get('facId');
  const facId = facIdParam ? Number(facIdParam) : null;

  const [tab, setTab] = useState<TabName>('Overview');

  const fetcher = useCallback(
    () => (orgUuid ? patientsApi.get(orgUuid, patientId) : Promise.resolve(null)),
    [orgUuid, patientId],
  );
  const { data: patient, loading, refetch } = useApi(fetcher, [orgUuid, patientId]);

  const name =
    patient && (patient.firstName || patient.lastName)
      ? [patient.firstName, patient.lastName].filter(Boolean).join(' ')
      : `Patient ${patientId}`;

  if (!orgUuid) {
    return (
      <>
        <Topbar title="Patient" crumbs={[{ label: 'PCC' }, { label: 'Patients', href: '/patients' }]} />
        <main className="content">
          <div className="state">Select an organization first.</div>
        </main>
      </>
    );
  }

  return (
    <>
      <Topbar
        title={name}
        crumbs={[{ label: 'PCC' }, { label: 'Patients', href: '/patients' }]}
        actions={
          <SyncButton
            label="Sync patient from PCC"
            variant="primary"
            run={() => patientsApi.syncPatient(orgUuid, patientId)}
            onDone={refetch}
          />
        }
      />
      <main className="content">
        <div className="tabs" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className="tab"
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Overview' && (
          <div className="card" style={{ maxWidth: 640 }}>
            {loading ? (
              'Loading patient…'
            ) : patient ? (
              <dl className="def-list">
                <dt>Patient ID</dt><dd>{patient.patientId ?? patientId}</dd>
                <dt>Name</dt><dd>{name}</dd>
                <dt>Gender</dt><dd>{patient.gender ?? '—'}</dd>
                <dt>Date of birth</dt><dd>{formatDate(patient.birthDate)}</dd>
                <dt>Status</dt><dd>{patient.patientStatus ?? '—'}</dd>
                <dt>Facility</dt><dd>{patient.facId ?? facId ?? '—'}</dd>
                <dt>Room</dt><dd>{patient.roomDesc ?? '—'}</dd>
                <dt>MRN</dt><dd>{patient.medicalRecordNumber ?? '—'}</dd>
                <dt>Admitted</dt><dd>{formatDate(patient.admissionDate)}</dd>
              </dl>
            ) : (
              <p style={{ margin: 0 }} className="text-muted">
                This patient isn&apos;t in the local database yet. Use “Sync patient from PCC”
                above, or sync clinical data from the tabs.
              </p>
            )}
          </div>
        )}

        {tab === 'Allergies' && <AllergiesTab orgUuid={orgUuid} patientId={patientId} facId={facId} />}
        {tab === 'Conditions' && <ConditionsTab orgUuid={orgUuid} patientId={patientId} facId={facId} />}
        {tab === 'Medications' && <MedicationsTab orgUuid={orgUuid} patientId={patientId} facId={facId} />}
        {tab === 'Observations' && <ObservationsTab orgUuid={orgUuid} patientId={patientId} facId={facId} />}
        {tab === 'Progress Notes' && <ProgressNotesTab orgUuid={orgUuid} patientId={patientId} facId={facId} />}

        <p className="text-muted" style={{ fontSize: 12, marginTop: 'var(--space-4)' }}>
          Organization: {org?.name}
        </p>
      </main>
    </>
  );
}

export default function PatientDetailPage() {
  return (
    <Suspense fallback={null}>
      <PatientDetailInner />
    </Suspense>
  );
}
