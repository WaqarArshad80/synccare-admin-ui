import { redirect } from 'next/navigation';

// Entry point — the middleware sends unauthenticated users to /login, so the
// happy path lands on the dashboard.
export default function Home() {
  redirect('/dashboard');
}
