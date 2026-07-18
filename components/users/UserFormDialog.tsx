'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ApiError } from '@/lib/api';
import { organizationsApi, usersApi } from '@/lib/endpoints';
import { useApi } from '@/lib/useApi';
import type { User } from '@/lib/types';

interface Props {
  /** Provided when editing; omitted when creating. */
  user?: User;
  /** Prefill for the organization field (e.g. the current admin's org). */
  defaultOrganizationId?: string;
  onClose: () => void;
  onSaved: (user: User) => void;
}

const ROLE_OPTIONS = ['doctor', 'nurse'];

export function UserFormDialog({ user, defaultOrganizationId, onClose, onSaved }: Props) {
  const isEdit = Boolean(user);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role ?? 'doctor');
  const [organizationId, setOrganizationId] = useState(
    user?.organizationId ?? defaultOrganizationId ?? '',
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const firstRef = useRef<HTMLInputElement>(null);

  // Organization picker options, from GET /organizations. Value = pccOrgUuid (the
  // `orgUuid` the backend keys users by, same as the PCC screens); label shows
  // name + PCC code for recognition.
  const orgFetcher = useCallback(() => organizationsApi.list(), []);
  const { data: orgs, loading: orgsLoading, error: orgsError } = useApi(orgFetcher);
  const orgOptions = (orgs ?? []).map((o) => ({
    value: o.pccOrgUuid,
    label: `${o.name} · ${o.pccOrgCode}`,
  }));
  // Preserve a current value that isn't in the list (e.g. a legacy id like ORG001).
  const hasCurrentInList = orgOptions.some((o) => o.value === organizationId);
  // Fall back to a free-text input if the org list can't be loaded.
  const useTextFallback = Boolean(orgsError) || (!orgsLoading && orgOptions.length === 0);

  useEffect(() => {
    firstRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  // Keep the current role selectable even if it's outside doctor|nurse (e.g. admin).
  const roleOptions = ROLE_OPTIONS.includes(role) ? ROLE_OPTIONS : [role, ...ROLE_OPTIONS];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const base = {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        // The backend expects the org's UUID in canonical all-caps form
        // (e.g. 67EFB7C2-5CAD-481E-A712-421AECF52FFC).
        organizationId: organizationId.trim().toUpperCase(),
        role,
      };
      const saved = isEdit
        ? // On edit the password is optional — only send it when the admin typed one.
          await usersApi.update(user!.id, password ? { ...base, password } : base)
        : await usersApi.create({ ...base, password });
      onSaved(saved);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : `Could not ${isEdit ? 'update' : 'create'} the user.`,
      );
      setSubmitting(false);
    }
  }

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <form
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-title"
        onSubmit={handleSubmit}
      >
        <div className="dialog-title" id="user-form-title">
          {isEdit ? 'Edit user' : 'New user'}
        </div>

        <div className="dialog-body" style={{ display: 'grid', gap: 'var(--space-3)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="field">
              <label htmlFor="u-first">First name *</label>
              <input
                ref={firstRef}
                id="u-first"
                className="input"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="u-last">Last name *</label>
              <input
                id="u-last"
                className="input"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="u-email">Email *</label>
            <input
              id="u-email"
              type="email"
              className="input"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="u-pass">
              {isEdit
                ? 'New password (leave blank to keep current)'
                : 'Password * (min 6 characters)'}
            </label>
            <input
              id="u-pass"
              type="password"
              className="input"
              required={!isEdit}
              minLength={password ? 6 : undefined}
              autoComplete="new-password"
              placeholder={isEdit ? '••••••' : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="field">
              <label htmlFor="u-role">Role</label>
              <select
                id="u-role"
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="u-org">Organization *</label>
              {useTextFallback ? (
                <input
                  id="u-org"
                  className="input"
                  required
                  placeholder="Organization ID"
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                />
              ) : (
                <select
                  id="u-org"
                  className="input"
                  required
                  disabled={orgsLoading}
                  value={organizationId}
                  onChange={(e) => setOrganizationId(e.target.value)}
                >
                  <option value="" disabled>
                    {orgsLoading ? 'Loading organizations…' : 'Select an organization…'}
                  </option>
                  {organizationId && !hasCurrentInList && (
                    <option value={organizationId}>{organizationId} (current)</option>
                  )}
                  {orgOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {error && (
            <p style={{ margin: 0, fontSize: 13, color: 'var(--color-accent-700)' }} role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="dialog-actions">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create user'}
          </Button>
        </div>
      </form>
    </div>
  );
}
