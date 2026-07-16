'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { OrgSwitcher } from '@/components/shell/OrgSwitcher';
import {
  BuildingIcon,
  DashboardIcon,
  FacilityIcon,
  LogOutIcon,
  PatientIcon,
  SettingsIcon,
  UsersIcon,
} from '@/components/icons';
import type { ComponentType, SVGProps } from 'react';

interface NavItem {
  href: string;
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
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
            {group.items.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  className="nav-item"
                  aria-current={active ? 'page' : undefined}
                >
                  <Icon />
                  {label}
                </Link>
              );
            })}
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
