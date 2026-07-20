"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Check, Phone } from "lucide-react";
import { updateInvoiceContact } from "@/lib/actions/profiles";
import type { InvoiceContact } from "@/lib/constants/company";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface InvoiceContactSettingProps {
  initialContact: InvoiceContact;
}

export function InvoiceContactSetting({
  initialContact,
}: InvoiceContactSettingProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [contactName, setContactName] = useState(initialContact.contactName);
  const [contactPhone1, setContactPhone1] = useState(
    initialContact.contactPhone1
  );
  const [contactPhone2, setContactPhone2] = useState(
    initialContact.contactPhone2
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setContactName(initialContact.contactName);
    setContactPhone1(initialContact.contactPhone1);
    setContactPhone2(initialContact.contactPhone2);
  }, [initialContact]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateInvoiceContact({
        contactName,
        contactPhone1,
        contactPhone2,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-surface p-6 shadow-card"
    >
      <div className="flex items-start gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <Phone className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Invoice Contact
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Contact name and mobile numbers shown in the footer of invoices and quotations.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <Input
          label="Contact name"
          value={contactName}
          onChange={(e) => {
            setContactName(e.target.value);
            setSaved(false);
          }}
          placeholder="Mohamed"
        />
        <Input
          label="Mobile phone 1"
          value={contactPhone1}
          onChange={(e) => {
            setContactPhone1(e.target.value);
            setSaved(false);
          }}
          placeholder="4412241"
        />
        <Input
          label="Mobile phone 2"
          value={contactPhone2}
          onChange={(e) => {
            setContactPhone2(e.target.value);
            setSaved(false);
          }}
          placeholder="(252) 63-1234567"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save Contact"}
          </Button>
          {saved && (
            <span className="inline-flex items-center gap-1 text-sm text-green-600">
              <Check className="h-4 w-4" />
              Saved
            </span>
          )}
        </div>
      </div>
    </form>
  );
}
