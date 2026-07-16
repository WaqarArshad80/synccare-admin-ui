import { Sidebar } from '@/components/shell/Sidebar';
import { OrgProvider } from '@/lib/orgContext';

// Admin frame: fixed sidebar + a flex "main" column. Each page renders its own
// <Topbar/> (crumbs + actions differ per page) followed by its content.
// OrgProvider supplies the active organization's pccOrgUuid to the PCC screens.
export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrgProvider>
      <div className="shell">
        <Sidebar />
        <div className="main">{children}</div>
      </div>
    </OrgProvider>
  );
}
