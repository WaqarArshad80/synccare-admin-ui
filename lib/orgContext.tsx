'use client';

// Active-organization context. Every PCC endpoint is keyed by an org's
// pccOrgUuid, so the PCC screens read the selected org from here. The choice is
// persisted in localStorage and defaults to the first organization.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { organizationsApi } from './endpoints';
import type { Organization } from './types';

const STORAGE_KEY = 'syncare_active_org';

interface OrgContextValue {
  orgs: Organization[];
  org: Organization | null;
  /** The selected org's pccOrgUuid — the `orgUuid` path param for PCC calls. */
  orgUuid: string | null;
  loading: boolean;
  error: string | null;
  selectOrg: (id: string) => void;
  reload: () => void;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    organizationsApi
      .list()
      .then((list) => {
        if (cancelled) return;
        setOrgs(list);
        const stored =
          typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) : null;
        const valid = stored && list.some((o) => o.id === stored) ? stored : list[0]?.id ?? null;
        setSelectedId(valid);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load organizations.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  const selectOrg = useCallback((id: string) => {
    setSelectedId(id);
    if (typeof window !== 'undefined') window.localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  const org = useMemo(
    () => orgs.find((o) => o.id === selectedId) ?? null,
    [orgs, selectedId],
  );

  const value: OrgContextValue = {
    orgs,
    org,
    orgUuid: org?.pccOrgUuid ?? null,
    loading,
    error,
    selectOrg,
    reload,
  };

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) throw new Error('useOrg must be used within <OrgProvider>');
  return ctx;
}
