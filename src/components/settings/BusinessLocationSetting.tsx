"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Check, MapPin } from "lucide-react";
import { updateBusinessLocation } from "@/lib/actions/profiles";
import type { BusinessLocation } from "@/lib/constants/company";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface BusinessLocationSettingProps {
  initialLocation: BusinessLocation;
}

export function BusinessLocationSetting({
  initialLocation,
}: BusinessLocationSettingProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [addressLine1, setAddressLine1] = useState(initialLocation.addressLine1);
  const [addressLine2, setAddressLine2] = useState(initialLocation.addressLine2);
  const [phone, setPhone] = useState(initialLocation.phone);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setAddressLine1(initialLocation.addressLine1);
    setAddressLine2(initialLocation.addressLine2);
    setPhone(initialLocation.phone);
  }, [initialLocation]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);

    startTransition(async () => {
      const result = await updateBusinessLocation({
        addressLine1,
        addressLine2,
        phone,
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
          <MapPin className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Business Location
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Address and phone shown in the company block on invoices and quotations.
          </p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <Input
          label="Address line 1"
          value={addressLine1}
          onChange={(e) => {
            setAddressLine1(e.target.value);
            setSaved(false);
          }}
          placeholder="Hargaisa. Somaliland"
        />
        <Input
          label="Address line 2"
          value={addressLine2}
          onChange={(e) => {
            setAddressLine2(e.target.value);
            setSaved(false);
          }}
          placeholder="Ibrahim Koodbur, Badacas"
        />
        <Input
          label="Business phone"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setSaved(false);
          }}
          placeholder="(252) 63-4412241"
        />

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Saving…" : "Save Location"}
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
