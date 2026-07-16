'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { OrgSwitcher } from '@/components/shell/OrgSwitcher';
import {
  BuildingIcon,
  ChevronRightIcon,
  DashboardIcon,
  FacilityIcon,
  LogOutIcon,
  NotesIcon,
  ObservationIcon,
  PatientIcon,
  PillIcon,
  SettingsIcon,
  UsersIcon,
  WebhookIcon,
} from '@/components/icons';
import type { ComponentType, SVGProps } from 'react';

interface NavItem {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Nested links rendered indented under a collapsible parent. */
  children?: { href: string; label: string }[];
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Overview',
    items: [{ href: '/dashboard', label: 'Dashboard', Icon: DashboardIcon }],
  },
  {
    label: 'Manage',
    items: [
      { href: '/organizations', label: 'Organizations', Icon: BuildingIcon },
      { href: '/users', label: 'Users', Icon: UsersIcon },
    ],
  },
  {
    label: 'PCC',
    items: [
      { href: '/facilities', label: 'Facilities', Icon: FacilityIcon },
      { href: '/patients', label: 'Patients', Icon: PatientIcon },
      { href: '/medications', label: 'Medications', Icon: PillIcon },
      { href: '/observations', label: 'Observations', Icon: ObservationIcon },
      { href: '/progress-notes', label: 'Progress Notes', Icon: NotesIcon },
    ],
  },
  {
    label: 'Webhooks',
    items: [
      {
        href: '/webhooks',
        label: 'Webhooks',
        Icon: WebhookIcon,
        children: [{ href: '/webhooks/subscriptions', label: 'Subscribed' }],
      },
    ],
  },
  {
    label: 'System',
    items: [{ href: '/settings', label: 'Settings', Icon: SettingsIcon }],
  },
];

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/** A single nav entry — a plain link, or a collapsible parent with sub-links. */
function NavEntry({ item, pathname }: { item: NavItem; pathname: string }) {
  const { href, label, Icon, children } = item;
  const isActive = (h: string) => pathname === h || pathname.startsWith(h + '/');

  if (!children || children.length === 0) {
    return (
      <Link href={href} className="nav-item" aria-current={isActive(href) ? 'page' : undefined}>
        <Icon />
        {label}
      </Link>
    );
  }

  // Expanded by default whenever the current route is within this section.
  const withinSection = isActive(href) || children.some((c) => isActive(c.href));
  const [open, setOpen] = useState(withinSection);

  return (
    <>
      <button
        type="button"
        className="nav-item nav-parent"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon />
        {label}
        <ChevronRightIcon className="chevron" width={16} height={16} />
      </button>
      {open &&
        children.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="nav-item nav-sub"
            aria-current={isActive(c.href) ? 'page' : undefined}
          >
            {c.label}
          </Link>
        ))}
    </>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="mark" /> SynCare Admin
      </div>

      <OrgSwitcher />

      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div className="nav-group" key={group.label}>
            <p className="nav-group-label">{group.label}</p>
            {group.items.map((item) => (
              <NavEntry key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="avatar">{user ? initials(user.name) : '··'}</div>
        <div className="who">
          <div className="name">{user?.name ?? 'Loading…'}</div>
          <div className="role">{user?.role ?? ''}</div>
        </div>
        <Button variant="ghost" icon aria-label="Log out" onClick={logout}>
          <LogOutIcon width={18} height={18} />
        </Button>
      </div>
    </aside>
  );
}
