import { Fragment, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronRightIcon } from '@/components/icons';
import { QuotaBadge } from '@/components/shell/QuotaBadge';

export interface Crumb {
  label: string;
  href?: string;
}

interface TopbarProps {
  title: string;
  /** Ancestor crumbs shown before the page title. */
  crumbs?: Crumb[];
  /** Right-aligned actions (buttons). */
  actions?: ReactNode;
}

export function Topbar({ title, crumbs = [], actions }: TopbarProps) {
  return (
    <header className="topbar">
      <div className="crumbs">
        {crumbs.map((c) => (
          <Fragment key={c.label}>
            {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
            <ChevronRightIcon />
          </Fragment>
        ))}
        <h1 className="page-title">{title}</h1>
      </div>
      <QuotaBadge />
      {actions}
    </header>
  );
}
