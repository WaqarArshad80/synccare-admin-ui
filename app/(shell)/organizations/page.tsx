'use client';

import { useCallback, useState } from 'react';
import { Topbar } from '@/components/shell/Topbar';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { NewOrganizationDialog } from '@/components/organizations/NewOrganizationDialog';
import { organizationsApi } from '@/lib/endpoints';
import { useApi } from '@/lib/useApi';

// Reference "live" page: fetches GET /organizations and renders loading / error
// / empty / data states with the Modernist table. Copy this pattern for the
// other sections (Facilities, Patients — those hang off an org's pccOrgUuid).
export default function OrganizationsPage() {
  const fetcher = useCallback(() => organizationsApi.list(), []);
  const { data, loading, error, refetch } = useApi(fetcher);
  const [showNew, setShowNew] = useState(false);

  const orgs = data ?? [];

  return (
    <>
      <Topbar
        title="Organizations"
        crumbs={[{ label: 'Manage' }]}
        actions={
          <>
            <Button variant="secondary" onClick={refetch}>
              Refresh
            </Button>
            <Button variant="primary" onClick={() => setShowNew(true)}>
              New organization
            </Button>
          </>
        }
      />
      <main className="content">
        {loading && <div className="state">Loading organizations…</div>}

        {error && !loading && (
          <div className="state">
            <p style={{ margin: '0 0 var(--space-3)' }}>{error}</p>
            <Button variant="secondary" onClick={refetch}>
              Try again
            </Button>
          </div>
        )}

        {!loading && !error && orgs.length === 0 && (
          <div className="state">No organizations found.</div>
        )}

        {!loading && !error && orgs.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Address</th>
                <th>PCC Org Code</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => (
                <tr key={o.id}>
                  <td>{o.name}</td>
                  <td className="text-muted">{o.email}</td>
                  <td className="text-muted">{o.address}</td>
                  <td>
                    <Tag tone="accent">{o.pccOrgCode}</Tag>
                  </td>
                  <td className="text-muted">{formatDate(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {showNew && (
        <NewOrganizationDialog
          onClose={() => setShowNew(false)}
          onCreated={() => {
            setShowNew(false);
            refetch();
          }}
        />
      )}
    </>
  );
}

function formatDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
