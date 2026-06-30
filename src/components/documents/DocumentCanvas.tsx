"use client";

import "@/styles/invoice-document.css";
import {
  calculateDocumentTotals,
  calculateLineTotal,
  formatCurrencyPlain,
  formatDate,
  formatPriceDisplay,
} from "@/lib/utils/format";
import { COMPANY_INFO, DEFAULT_TERMS } from "@/lib/constants/company";
import type {
  Client,
  DocumentType,
  DocumentStatus,
  LineItemForm,
  Profile,
} from "@/lib/types/database";
import { StampOverlay } from "./StampOverlay";

export interface DocumentCanvasProps {
  type: DocumentType;
  status: DocumentStatus;
  documentNumber: string;
  issueDate: string;
  dueDate: string;
  client: Client | null;
  profile: Profile | null;
  items: LineItemForm[];
  taxRate: number;
  hasStamp: boolean;
  notes?: string;
}

function parseTerms(notes?: string): string[] {
  if (!notes?.trim()) return DEFAULT_TERMS;
  const lines = notes.split("\n").filter((line) => line.trim());
  return lines.length > 0 ? lines : DEFAULT_TERMS;
}

export function DocumentCanvas({
  type,
  status,
  documentNumber,
  issueDate,
  client,
  profile,
  items,
  taxRate,
  hasStamp,
  notes,
}: DocumentCanvasProps) {
  const { subtotal, tax: discount, grandTotal } = calculateDocumentTotals(
    items,
    taxRate
  );
  const showStamp =
    hasStamp || (type === "invoice" && status === "issued") || status === "paid";

  const companyLogo = profile?.logo_url || "/logo.jpeg";
  const clientLogo = client?.logo_url || "/client.png";
  const companyName = profile?.company_name || COMPANY_INFO.name;
  const docLabel = type === "quotation" ? "Quotation" : "Invoice";
  const terms = parseTerms(notes);
  const lineItems = items.filter((i) => i.product_name.trim());
  const headerTheme = profile?.invoice_header_theme ?? "blue";

  return (
    <div
      id="invoice-print-root"
      className={`invoice-document invoice-theme-${headerTheme} shadow-panel print:shadow-none`}
    >
      {showStamp && (
        <div className="invoice-stamp">
          <StampOverlay className="h-[120px] w-[120px]" />
        </div>
      )}

      <header>
        <h1>{companyName}</h1>
        <div className="invoice-header-row">
          <address>
            <p>{companyName}</p>
            <p>
              {COMPANY_INFO.addressLine1}
              <br />
              {COMPANY_INFO.addressLine2}
            </p>
            <p>{COMPANY_INFO.phone}</p>
          </address>
          <div className="invoice-logo-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={companyLogo}
              src={companyLogo}
              alt={companyName}
              className="invoice-logo"
            />
          </div>
        </div>
      </header>

      <div className="invoice-main">
        <article>
        <h1>Recipient</h1>
        <div className="invoice-recipient-row">
          <address>
            <p className="capitalize">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={clientLogo}
                alt={client?.name ?? "Client"}
                className="client-logo"
                width={300}
              />
            </p>
            {client?.address && <p>{client.address}</p>}
          </address>

          <table className="meta">
            <tbody>
              <tr>
                <th>
                  <span>{docLabel} #</span>
                </th>
                <td>
                  <span>{documentNumber || "—"}</span>
                </td>
              </tr>
              <tr>
                <th>
                  <span>Date</span>
                </th>
                <td>
                  <span>{formatDate(issueDate)}</span>
                </td>
              </tr>
              <tr>
                <th>
                  <span>Amount Due</span>
                </th>
                <td>
                  <span className="price-prefix">$</span>
                  <span>{formatCurrencyPlain(grandTotal)}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <table className="inventory">
          <thead>
            <tr>
              <th>
                <span>Item Description</span>
              </th>
              <th>
                <span>Quantity</span>
              </th>
              <th>
                <span>Unit Price</span>
              </th>
              <th>
                <span>Price</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {lineItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-row">
                  No line items added yet
                </td>
              </tr>
            ) : (
              lineItems.map((item) => {
                const lineTotal = calculateLineTotal(
                  item.unit_price,
                  item.quantity
                );
                return (
                  <tr key={item.id}>
                    <td>
                      <span>{item.product_name}</span>
                    </td>
                    <td>
                      <span>{item.quantity}&nbsp;</span>pcs
                    </td>
                    <td>
                      <span className="price-prefix">$</span>
                      <span>{formatPriceDisplay(item.unit_price)}</span>
                    </td>
                    <td>
                      <span className="price-prefix">$</span>
                      <span>{formatPriceDisplay(lineTotal)}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <table className="balance">
          <tbody>
            <tr>
              <th>
                <span>Total</span>
              </th>
              <td>
                <span className="price-prefix">$</span>
                <span>{formatCurrencyPlain(subtotal)}</span>
              </td>
            </tr>
            <tr>
              <th>
                <span>Discount</span>
              </th>
              <td>
                <span className="price-prefix">$</span>
                <span>{formatCurrencyPlain(discount)}</span>
              </td>
            </tr>
            <tr>
              <th>
                <span>Balance Due</span>
              </th>
              <td>
                <span className="price-prefix">$</span>
                <span>{formatCurrencyPlain(grandTotal)}</span>
              </td>
            </tr>
          </tbody>
        </table>
        </article>
      </div>

      <div className="invoice-bottom">
        <aside className="asideHeader">
          <h1>Terms And Conditions</h1>
          <div>
            {terms.map((term, index) => (
              <p key={index}>
                <span>{index + 1}:</span> {term}
              </p>
            ))}
          </div>
        </aside>

        <footer className="footer">
          <div className="invoice-section-bar">
            <p>
              If you have questions about this{" "}
              {type === "quotation" ? "quotation" : "invoice"}
            </p>
            <p>
              Contact {COMPANY_INFO.contactName} on Tel :{" "}
              {COMPANY_INFO.contactPhone}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
