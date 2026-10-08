"use client";

import "@/styles/invoice-document.css";
import {
  calculateDocumentTotals,
  calculateLineTotal,
  formatCurrencyPlain,
  formatDate,
  formatPriceDisplay,
} from "@/lib/utils/format";
import {
  formatContactPhones,
  getBusinessLocation,
  getCompanyDisplayName,
  getInvoiceContact,
} from "@/lib/constants/company";
import { getStampUrl } from "@/lib/constants/stamps";
import {
  getDefaultTerms,
  resolveDocumentTerms,
} from "@/lib/utils/terms";
import type {
  Client,
  DocumentType,
  DocumentStatus,
  LineItemForm,
  Profile,
} from "@/lib/types/database";
import { hasClientLogo } from "@/lib/utils/client-logo";
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
  hideClientName?: boolean;
  notes?: string;
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
  hideClientName = false,
  notes,
}: DocumentCanvasProps) {
  const { subtotal, tax: discount, grandTotal } = calculateDocumentTotals(
    items,
    taxRate
  );
  const showStamp =
    hasStamp || (type === "invoice" && status === "issued") || status === "paid";

  const companyLogo = profile?.logo_url || "/logo-m2b.png";
  const showClientLogo = hasClientLogo(client?.logo_url);
  const hideNameOnDocument =
    hideClientName && showClientLogo && Boolean(client?.logo_url);
  const showClientName = Boolean(client?.name) && !hideNameOnDocument;
  const showClientAddress = Boolean(client?.address);
  const companyName = getCompanyDisplayName(profile);
  const docLabel = type === "quotation" ? "Quotation" : "Invoice";
  const terms = resolveDocumentTerms(notes, getDefaultTerms(profile));
  const lineItems = items.filter((i) => i.product_name.trim());
  const headerTheme = "m2b";
  const stampUrl = getStampUrl(profile?.invoice_stamp);
  const contact = getInvoiceContact(profile);
  const contactPhones = formatContactPhones(contact);
  const location = getBusinessLocation(profile);

  return (
    <div
      id="invoice-print-root"
      className={`invoice-document invoice-theme-${headerTheme} shadow-panel print:shadow-none`}
    >
      {showStamp && (
        <div className="invoice-stamp">
          <StampOverlay
            className={
              profile?.invoice_stamp === "m2b"
                ? "h-[140px] w-[140px]"
                : "h-[120px] w-[120px]"
            }
            src={stampUrl}
          />
        </div>
      )}

      <header>
        <h1>{companyName}</h1>
        <div className="invoice-header-row">
          <address>
            <p>{companyName}</p>
            <p>
              {location.addressLine1}
              <br />
              {location.addressLine2}
            </p>
            <p>{location.phone}</p>
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
          <div
            className={`invoice-client-block${
              hideNameOnDocument
                ? " invoice-client-block--logo-leading"
                : showClientLogo
                  ? ""
                  : " invoice-client-block--no-logo"
            }`}
          >
            {hideNameOnDocument && showClientLogo && client?.logo_url ? (
              <div className="invoice-client-leading">
                <div className="invoice-client-logo-wrap invoice-client-logo-wrap--leading">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={client.logo_url}
                    alt={client.name}
                    className="client-logo client-logo--leading"
                  />
                </div>
                {showClientAddress && (
                  <address>
                    <p>{client.address}</p>
                  </address>
                )}
              </div>
            ) : (
              <div
                className={`invoice-client-row${
                  showClientLogo ? "" : " invoice-client-row--no-logo"
                }`}
              >
                {(showClientName || showClientAddress) && (
                  <address>
                    {showClientName && (
                      <p
                        className={`invoice-client-name${showClientLogo ? "" : " invoice-client-name--prominent"}`}
                      >
                        {client!.name}
                      </p>
                    )}
                    {client?.address && <p>{client.address}</p>}
                  </address>
                )}
                {showClientLogo && client?.logo_url && (
                  <div className="invoice-client-logo-wrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={client.logo_url}
                      alt={client.name}
                      className="client-logo"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

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
        {terms.length > 0 && (
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
        )}

        <footer className="footer">
          <div className="invoice-section-bar">
            <p>
              If you have questions about this{" "}
              {type === "quotation" ? "quotation" : "invoice"}
            </p>
            <p>
              Contact {contact.contactName} on Tel : {contactPhones}
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
