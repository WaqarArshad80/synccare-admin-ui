import { redirect } from 'next/navigation';

// Webhooks has no landing page of its own yet — send visitors to the
// subscriptions view (the only sub-link).
export default function WebhooksPage() {
  redirect('/webhooks/subscriptions');
}
