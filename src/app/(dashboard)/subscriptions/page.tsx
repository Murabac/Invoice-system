import { Header } from "@/components/layout/Header";
import { SubscriptionsManager } from "@/components/subscriptions/SubscriptionsManager";
import { getClients } from "@/lib/actions/clients";
import {
  getSubscriptionSummary,
  listSubscriptions,
} from "@/lib/actions/subscriptions";

export default async function SubscriptionsPage() {
  const [subscriptions, summary, clients] = await Promise.all([
    listSubscriptions(),
    getSubscriptionSummary(),
    getClients(),
  ]);

  return (
    <>
      <Header
        title="Subscriptions"
        description="Domains, SaaS, and renewals by client — expand a client to see their subscriptions"
      />
      <div className="page-content">
        <SubscriptionsManager
          clients={clients}
          subscriptions={subscriptions}
          summary={summary}
        />
      </div>
    </>
  );
}
