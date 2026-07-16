import { Topbar, type Crumb } from '@/components/shell/Topbar';

/** A not-yet-built section: shell + topbar + an empty-state note. */
export function Placeholder({ title, crumbs }: { title: string; crumbs?: Crumb[] }) {
  return (
    <>
      <Topbar title={title} crumbs={crumbs} />
      <main className="content">
        <div className="state">
          <p style={{ margin: 0 }}>
            <strong>{title}</strong> isn&apos;t built yet.
          </p>
          <p className="text-muted" style={{ margin: 'var(--space-2) 0 0', fontSize: 13 }}>
            Follow the pattern in the Organizations page to wire this section to the API.
          </p>
        </div>
      </main>
    </>
  );
}
