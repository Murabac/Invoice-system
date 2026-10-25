import { Header } from "@/components/layout/Header";
import { SubscriptionsManager } from "@/components/subscriptions/SubscriptionsManager";
import {
  getSubscriptionSummary,
  listSubscriptions,
} from "@/lib/actions/subscriptions";

export default async function SubscriptionsPage() {
  const [subscriptions, summary] = await Promise.all([
    listSubscriptions(),
    getSubscriptionSummary(),
  ]);

  return (
    <>
      <Header
        title="Subscriptions"
        description="Domains, SaaS, and renewals — track expiry dates in one place"
      />
      <div className="page-content">
        <SubscriptionsManager
          subscriptions={subscriptions}
          summary={summary}
        />
      </div>
    </>
  );
}
