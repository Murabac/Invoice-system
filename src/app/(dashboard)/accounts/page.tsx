import { Header } from "@/components/layout/Header";
import { AccountsPanel } from "@/components/accounts/AccountsPanel";
import {
  listAccountsWithBalances,
  listAccountTransactions,
} from "@/lib/actions/accounts";

export default async function AccountsPage() {
  const [accounts, transactions] = await Promise.all([
    listAccountsWithBalances(),
    listAccountTransactions(),
  ]);

  return (
    <>
      <Header
        title="Accounts"
        description="Prepaid cards and wallets — top up creates a treasury expense; spends only reduce the card balance"
      />
      <div className="page-content">
        <AccountsPanel accounts={accounts} transactions={transactions} />
      </div>
    </>
  );
}
