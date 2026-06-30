import type { LineItemForm } from "@/lib/types/database";

export function calculateLineTotal(unitPrice: number, quantity: number): number {
  return roundCurrency(unitPrice * quantity);
}

export function calculateDocumentTotals(
  items: LineItemForm[],
  taxRate: number
): { subtotal: number; tax: number; grandTotal: number } {
  const subtotal = roundCurrency(
    items.reduce(
      (sum, item) => sum + calculateLineTotal(item.unit_price, item.quantity),
      0
    )
  );
  const discount = roundCurrency(subtotal * (taxRate / 100));
  const grandTotal = roundCurrency(subtotal - discount);

  return { subtotal, tax: discount, grandTotal };
}

export function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatCurrencyPlain(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPriceDisplay(amount: number): string {
  if (amount === 0) return "Free";
  return formatCurrencyPlain(amount);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date + "T00:00:00"));
}

export function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

export function addDaysISO(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

export function generateTempId(): string {
  return `temp-${crypto.randomUUID()}`;
}

export function createEmptyLineItem(): LineItemForm {
  return {
    id: generateTempId(),
    product_name: "",
    unit_price: 0,
    quantity: 1,
  };
}

export function padDocumentNumber(num: number): string {
  return `#${String(num).padStart(4, "0")}`;
}
