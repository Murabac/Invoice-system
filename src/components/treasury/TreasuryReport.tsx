import "@/styles/treasury-report.css";
import {
  formatContactPhones,
  getBusinessLocation,
  getCompanyDisplayName,
  getInvoiceContact,
  M2B_LOGO_URL,
} from "@/lib/constants/company";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { CashbookEntryView } from "@/lib/actions/cashbook";
import type { Profile } from "@/lib/types/database";

export interface TreasuryReportSummary {
  balance: number;
  totalIncome: number;
  totalExpense: number;
  incomeMtd: number;
  expenseMtd: number;
}

interface TreasuryReportProps {
  profile: Profile | null;
  entries: CashbookEntryView[];
  summary: TreasuryReportSummary;
}

interface LedgerRow {
  entry: CashbookEntryView;
  income: number | null;
  expense: number | null;
  balance: number;
}

function buildLedgerRows(entries: CashbookEntryView[]): LedgerRow[] {
  const sorted = [...entries].sort((a, b) => {
    const byDate = a.entry_date.localeCompare(b.entry_date);
    if (byDate !== 0) return byDate;
    return a.created_at.localeCompare(b.created_at);
  });

  let balance = 0;
  return sorted.map((entry) => {
    const amount = Number(entry.amount);
    if (entry.entry_type === "income") {
      balance += amount;
      return { entry, income: amount, expense: null, balance };
    }
    balance -= amount;
    return { entry, income: null, expense: amount, balance };
  });
}

function reportPeriodLabel(entries: CashbookEntryView[]): string {
  if (entries.length === 0) return "No transactions recorded";
  const dates = entries.map((e) => e.entry_date).sort();
  const from = dates[0];
  const to = dates[dates.length - 1];
  if (from === to) return formatDate(from);
  return `${formatDate(from)} – ${formatDate(to)}`;
}

export function TreasuryReport({
  profile,
  entries,
  summary,
}: TreasuryReportProps) {
  const companyName = getCompanyDisplayName(profile);
  const location = getBusinessLocation(profile);
  const contact = getInvoiceContact(profile);
  const logoUrl =
    profile?.dashboard_logo_url?.trim() ||
    profile?.logo_url?.trim() ||
    M2B_LOGO_URL;
  const website = profile?.website_url?.trim() || "https://m2btek.com";
  const generatedAt = new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(new Date());

  const ledgerRows = buildLedgerRows(entries);
  const period = reportPeriodLabel(entries);

  return (
    <article id="treasury-print-root" className="treasury-report">
      <header className="treasury-report__header">
        <div className="treasury-report__brand">
          <div className="treasury-report__logo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={logoUrl}
              alt=""
              className="treasury-report__logo"
            />
          </div>
          <div>
            <h1 className="treasury-report__company-name">{companyName}</h1>
            <div className="treasury-report__company-meta">
              <p>
                {location.addressLine1}
                {location.addressLine2 ? ` · ${location.addressLine2}` : ""}
              </p>
              <p>
                {location.phone}
                {contact.contactName
                  ? ` · ${contact.contactName}: ${formatContactPhones(contact)}`
                  : ""}
              </p>
            </div>
          </div>
        </div>
        <div className="treasury-report__title-block">
          <p className="treasury-report__title">Treasury Report</p>
          <p className="treasury-report__subtitle">Cashbook summary</p>
          <p className="treasury-report__subtitle">{period}</p>
        </div>
      </header>

      <div className="treasury-report__body">
        <div className="treasury-report__summary">
          <div className="treasury-report__stat treasury-report__stat--highlight">
            <p className="treasury-report__stat-label">Current balance</p>
            <p className="treasury-report__stat-value">
              {formatCurrency(summary.balance)}
            </p>
          </div>
          <div className="treasury-report__stat">
            <p className="treasury-report__stat-label">Total income</p>
            <p className="treasury-report__stat-value treasury-report__stat-value--income">
              {formatCurrency(summary.totalIncome)}
            </p>
          </div>
          <div className="treasury-report__stat">
            <p className="treasury-report__stat-label">Total expenses</p>
            <p className="treasury-report__stat-value treasury-report__stat-value--expense">
              {formatCurrency(summary.totalExpense)}
            </p>
          </div>
          <div className="treasury-report__stat">
            <p className="treasury-report__stat-label">Income (MTD)</p>
            <p className="treasury-report__stat-value treasury-report__stat-value--income">
              {formatCurrency(summary.incomeMtd)}
            </p>
          </div>
          <div className="treasury-report__stat">
            <p className="treasury-report__stat-label">Expenses (MTD)</p>
            <p className="treasury-report__stat-value treasury-report__stat-value--expense">
              {formatCurrency(summary.expenseMtd)}
            </p>
          </div>
        </div>

        <h2 className="treasury-report__section-title">Transaction ledger</h2>

        {ledgerRows.length === 0 ? (
          <p className="treasury-report__empty">No cashbook entries to display.</p>
        ) : (
          <div className="treasury-report__table-wrap">
            <table className="treasury-report__table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Type</th>
                  <th className="num">Income</th>
                  <th className="num">Expense</th>
                  <th className="num">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map(({ entry, income, expense, balance }) => (
                  <tr key={entry.id}>
                    <td>{formatDate(entry.entry_date)}</td>
                    <td>
                      {entry.display_description}
                      {entry.invoice_document_number && (
                        <span className="block text-xs text-gray-500">
                          {entry.invoice_document_number}
                        </span>
                      )}
                    </td>
                    <td>{entry.category || "—"}</td>
                    <td>
                      <span
                        className={`treasury-report__type-pill treasury-report__type-pill--${entry.entry_type}`}
                      >
                        {entry.entry_type}
                      </span>
                    </td>
                    <td className="num">
                      {income !== null ? formatCurrency(income) : "—"}
                    </td>
                    <td className="num">
                      {expense !== null ? formatCurrency(expense) : "—"}
                    </td>
                    <td className="num font-semibold text-[#1e3a5f]">
                      {formatCurrency(balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <footer className="treasury-report__footer">
          <p>
            <span className="treasury-report__tagline">
              Connecting today, building tomorrow.
            </span>
            {" · "}
            {website.replace(/^https?:\/\//, "")}
          </p>
          <p>Generated {generatedAt}</p>
        </footer>
      </div>
    </article>
  );
}
