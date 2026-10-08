import { Header } from "@/components/layout/Header";
import { TreasuryLedger } from "@/components/treasury/TreasuryLedger";
import {
  getCashbookSummary,
  listCashbookEntries,
} from "@/lib/actions/cashbook";
import { getProfile } from "@/lib/actions/profiles";

export default async function TreasuryPage() {
  const [entries, summary, profile] = await Promise.all([
    listCashbookEntries(),
    getCashbookSummary(),
    getProfile(),
  ]);

  return (
    <>
      <Header
        title="Treasury"
        description="Cashbook — track money in, money out, and running balance"
      />
      <div className="page-content">
        <TreasuryLedger
          profile={profile}
          entries={entries}
          summary={summary}
        />
      </div>
    </>
  );
}
