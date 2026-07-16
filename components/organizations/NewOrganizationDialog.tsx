'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ApiError } from '@/lib/api';
import { organizationsApi } from '@/lib/endpoints';
import type { CreateOrganizationInput, Organization } from '@/lib/types';

interface Props {
  onClose: () => void;
  /** Called with the created org after a successful POST. */
  onCreated: (org: Organization) => void;
}

const EMPTY: CreateOrganizationInput = {
  name: '',
  email: '',
  address: '',
  pccOrgUuid: '',
  pccOrgCode: '',
};

const FIELDS: { key: keyof CreateOrganizationInput; label: string; type?: string; required?: boolean }[] = [
  { key: 'name', label: 'Name', required: true },
  { key: 'email', label: 'Email', type: 'email', required: true },
  { key: 'address', label: 'Address' },
  { key: 'pccOrgUuid', label: 'PCC Org UUID' },
  { key: 'pccOrgCode', label: 'PCC Org Code' },
];

export function NewOrganizationDialog({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateOrganizationInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  // Focus the first field on open and close on Escape.
  useEffect(() => {
    firstFieldRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function update(key: keyof CreateOrganizationInput, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // Trim everything; send only the editable fields.
      const payload = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, v.trim()]),
      ) as CreateOrganizationInput;
      const created = await organizationsApi.create(payload);
      onCreated(created);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create the organization.');
      setSubmitting(false);
    }
  }

  return (
    <div
      className="dialog-backdrop"
      onMouseDown={(e) => {
        // Close only when the backdrop itself (not the dialog) is clicked.
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <form
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-org-title"
        onSubmit={handleSubmit}
      >
        <div className="dialog-title" id="new-org-title">
          New organization
        </div>

        <div className="dialog-body" style={{ display: 'grid', gap: 'var(--space-3)' }}>
          {FIELDS.map((f, i) => (
            <div className="field" key={f.key}>
              <label htmlFor={`org-${f.key}`}>
                {f.label}
                {f.required ? ' *' : ''}
              </label>
              <input
                ref={i === 0 ? firstFieldRef : undefined}
                id={`org-${f.key}`}
                className="input"
                type={f.type ?? 'text'}
                required={f.required}
                value={form[f.key]}
                onChange={(e) => update(f.key, e.target.value)}
              />
            </div>
          ))}

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
            {submitting ? 'Creating…' : 'Create organization'}
          </Button>
        </div>
      </form>
    </div>
  );
}
