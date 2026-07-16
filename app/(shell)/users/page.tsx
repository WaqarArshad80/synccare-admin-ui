'use client';

import { useCallback, useState } from 'react';
import { Topbar } from '@/components/shell/Topbar';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { UserFormDialog } from '@/components/users/UserFormDialog';
import { useAuth } from '@/lib/auth';
import { usersApi } from '@/lib/endpoints';
import { useApi } from '@/lib/useApi';
import type { User } from '@/lib/types';

type Modal = { kind: 'create' } | { kind: 'edit'; user: User } | { kind: 'delete'; user: User } | null;

export default function UsersPage() {
  const { user: me } = useAuth();
  const fetcher = useCallback(() => usersApi.list(), []);
  const { data, loading, error, refetch } = useApi(fetcher);
  const [modal, setModal] = useState<Modal>(null);

  const users = data ?? [];
  const close = () => setModal(null);
  const afterChange = () => {
    close();
    refetch();
  };

  return (
    <>
      <Topbar
        title="Users"
        crumbs={[{ label: 'Manage' }]}
        actions={
          <>
            <Button variant="secondary" onClick={refetch}>
              Refresh
            </Button>
            <Button variant="primary" onClick={() => setModal({ kind: 'create' })}>
              New user
            </Button>
          </>
        }
      />
      <main className="content">
        {loading && <div className="state">Loading users…</div>}

        {error && !loading && (
          <div className="state">
            <p style={{ margin: '0 0 var(--space-3)' }}>{error}</p>
            <Button variant="secondary" onClick={refetch}>
              Try again
            </Button>
          </div>
        )}

        {!loading && !error && users.length === 0 && (
          <div className="state">No users found.</div>
        )}

        {!loading && !error && users.length > 0 && (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Organization</th>
                <th>Last login</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.fullName || `${u.firstName} ${u.lastName}`.trim()}</td>
                  <td className="text-muted">{u.email}</td>
                  <td>
                    <Tag tone={u.role === 'admin' ? 'accent' : 'neutral'}>{u.role}</Tag>
                  </td>
                  <td className="text-muted">{u.organizationId}</td>
                  <td className="text-muted">{formatDate(u.lastLoginDate)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 'var(--space-1)', justifyContent: 'flex-end' }}>
                      <Button variant="ghost" onClick={() => setModal({ kind: 'edit', user: u })}>
                        Edit
                      </Button>
                      <Button variant="ghost" onClick={() => setModal({ kind: 'delete', user: u })}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>

      {modal?.kind === 'create' && (
        <UserFormDialog
          defaultOrganizationId={me?.organizationId}
          onClose={close}
          onSaved={afterChange}
        />
      )}
      {modal?.kind === 'edit' && (
        <UserFormDialog
          user={modal.user}
          defaultOrganizationId={me?.organizationId}
          onClose={close}
          onSaved={afterChange}
        />
      )}
      {modal?.kind === 'delete' && (
        <ConfirmDialog
          title="Delete user"
          confirmLabel="Delete"
          body={
            <>
              Delete <strong>{modal.user.fullName || modal.user.email}</strong>? This
              can&apos;t be undone.
            </>
          }
          onConfirm={async () => {
            await usersApi.remove(modal.user.id);
            afterChange();
          }}
          onClose={close}
        />
      )}
    </>
  );
}

function formatDate(value?: string): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}
