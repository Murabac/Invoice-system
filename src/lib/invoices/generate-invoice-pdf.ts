import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import {
  getBusinessLocation,
  getCompanyDisplayName,
} from "@/lib/constants/company";
import type { Profile } from "@/lib/types/database";
import type { DocumentWithRelations } from "@/lib/types/database";
import { formatCurrencyPlain, formatDate } from "@/lib/utils/format";
import { firstLineOfText } from "@/lib/utils/library-files";

function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars) {
      if (line) lines.push(line);
      line = word.length > maxChars ? word.slice(0, maxChars) : word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

export async function buildInvoicePdfBytes(
  document: DocumentWithRelations,
  profile: Profile | null
): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.12, 0.23, 0.37);

  let y = 800;
  const left = 50;

  const company = getCompanyDisplayName(profile);
  page.drawText(company, { x: left, y, size: 16, font: bold, color: navy });
  y -= 22;

  const location = getBusinessLocation(profile);
  for (const line of [location.addressLine1, location.addressLine2, location.phone]) {
    if (!line) continue;
    page.drawText(line, { x: left, y, size: 9, font, color: rgb(0.35, 0.35, 0.35) });
    y -= 12;
  }

  y -= 10;
  page.drawText(`Invoice ${document.document_number}`, {
    x: left,
    y,
    size: 14,
    font: bold,
    color: navy,
  });
  y -= 18;

  page.drawText(`Status: ${document.status}`, { x: left, y, size: 10, font });
  page.drawText(`Issue date: ${formatDate(document.issue_date)}`, {
    x: 320,
    y,
    size: 10,
    font,
  });
  y -= 14;
  page.drawText(`Due date: ${formatDate(document.due_date)}`, {
    x: 320,
    y,
    size: 10,
    font,
  });
  y -= 20;

  const clientName = document.clients?.name ?? "—";
  page.drawText("Bill to", { x: left, y, size: 10, font: bold });
  y -= 14;
  for (const line of wrapText(clientName, 60)) {
    page.drawText(line, { x: left, y, size: 10, font });
    y -= 12;
  }
  y -= 8;

  page.drawText("Description", { x: left, y, size: 9, font: bold });
  page.drawText("Qty", { x: 340, y, size: 9, font: bold });
  page.drawText("Price", { x: 390, y, size: 9, font: bold });
  page.drawText("Total", { x: 480, y, size: 9, font: bold });
  y -= 6;
  page.drawLine({
    start: { x: left, y },
    end: { x: 545, y },
    thickness: 1,
    color: rgb(0.85, 0.85, 0.85),
  });
  y -= 14;

  for (const item of document.document_items) {
    const descLines = wrapText(item.product_name, 48);
    for (let i = 0; i < descLines.length; i++) {
      page.drawText(descLines[i], { x: left, y, size: 9, font });
      if (i === 0) {
        page.drawText(String(item.quantity), { x: 340, y, size: 9, font });
        page.drawText(formatCurrencyPlain(Number(item.unit_price)), {
          x: 390,
          y,
          size: 9,
          font,
        });
        page.drawText(formatCurrencyPlain(Number(item.total)), {
          x: 480,
          y,
          size: 9,
          font,
        });
      }
      y -= 12;
      if (y < 120) break;
    }
    if (y < 120) break;
  }

  y = Math.min(y, 200);
  page.drawText(`Subtotal: ${formatCurrencyPlain(Number(document.subtotal))}`, {
    x: 390,
    y,
    size: 10,
    font,
  });
  y -= 14;
  page.drawText(
    `Tax (${document.tax_rate}%): ${formatCurrencyPlain(Number(document.tax))}`,
    { x: 390, y, size: 10, font }
  );
  y -= 16;
  page.drawText(`Total: ${formatCurrencyPlain(Number(document.grand_total))}`, {
    x: 390,
    y,
    size: 12,
    font: bold,
    color: navy,
  });

  return pdf.save();
}

export function invoiceLibraryTitle(document: DocumentWithRelations): string {
  const firstItem = document.document_items[0];
  if (firstItem?.product_name) {
    const line = firstLineOfText(firstItem.product_name);
    if (line) return line;
  }
  return `Invoice ${document.document_number}`;
}
