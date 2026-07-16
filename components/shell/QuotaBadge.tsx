'use client';

import { useCallback } from 'react';
import { useApi } from '@/lib/useApi';
import { appConfigApi } from '@/lib/endpoints';

/** Header chip showing the remaining PCC API quota (app-config/pcc_api_quota). */
export function QuotaBadge() {
  const fetcher = useCallback(() => appConfigApi.get('pcc_api_quota'), []);
  const { data, loading, error } = useApi(fetcher);

  // Stay quiet in the header if the value can't be loaded.
  if (error) return null;

  const raw = data?.data?.quotaRemaining;
  const value =
    raw == null
      ? '—'
      : Number.isFinite(Number(raw))
        ? Number(raw).toLocaleString()
        : String(raw);

  return (
    <div className="quota-badge" title="PointClickCare API quota remaining">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
      <span className="quota-label">PCC quota</span>
      <span className="quota-value">{loading ? '…' : value}</span>
    </div>
  );
}
