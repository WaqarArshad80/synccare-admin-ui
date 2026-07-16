'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { Topbar } from '@/components/shell/Topbar';
import { useAuth } from '@/lib/auth';
import { useApi } from '@/lib/useApi';
import { organizationsApi } from '@/lib/endpoints';

export default function DashboardPage() {
  const { user } = useAuth();
  const fetcher = useCallback(() => organizationsApi.list(), []);
  const { data: orgs, loading } = useApi(fetcher);

  const stats = [
    { label: 'Organizations', value: loading ? '…' : String(orgs?.length ?? 0) },
    { label: 'Your role', value: user?.role ?? '—' },
    { label: 'Organization', value: user?.organizationId ?? '—' },
    { label: 'Permissions', value: String(user?.permissions?.length ?? 0) },
  ];

  return (
    <>
      <Topbar title="Dashboard" crumbs={[{ label: 'Overview' }]} />
      <main className="content">
        <div className="stat-row">
          {stats.map((s) => (
            <div className="stat" key={s.label}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="section">
          <div className="section-head">
            <h4>Getting started</h4>
          </div>
          <div className="card">
            <p className="card-body" style={{ opacity: 1 }}>
              Signed in as <strong>{user?.name ?? '…'}</strong>. This admin console talks to
              the PCC Integration Service at <code>NEXT_PUBLIC_API_BASE_URL</code>. The{' '}
              <Link href="/organizations">Organizations</Link> page is wired live as the
              reference data-fetching pattern — copy it for Facilities and Patients (both
              hang off an organization&apos;s <code>pccOrgUuid</code>).
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
