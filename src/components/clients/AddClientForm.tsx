"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Building2, ImageIcon, Plus, Sparkles } from "lucide-react";
import { createClientRecord } from "@/lib/actions/clients";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function AddClientForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Client name is required.");
      return;
    }

    startTransition(async () => {
      const result = await createClientRecord({
        name: name.trim(),
        address: address.trim() || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push("/clients");
      router.refresh();
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-200 bg-surface p-4 shadow-card sm:p-6 lg:p-8"
      >
        <div className="mb-8">
          <div className="inline-flex rounded-xl bg-primary/10 p-3">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-900">
            Client details
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Enter the billing name and address shown on documents.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <Input
            label="Client Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acceptance and Change University"
            required
          />
          <div>
            <Input
              label="Address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city, country"
            />
            <p className="mt-1.5 text-xs text-gray-400">Optional</p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-6">
          <Button type="submit" disabled={isPending}>
            <Plus className="h-4 w-4" />
            {isPending ? "Creating…" : "Create Client"}
          </Button>
          <Link href="/clients">
            <Button type="button" variant="ghost" disabled={isPending}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>

      <aside className="space-y-4">
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <p className="text-sm font-semibold">Quick tip</p>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">
            After creating a client, upload their logo from the Clients List.
            Logos appear on quotations and invoices automatically.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-surface p-6 shadow-card">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gray-100 p-2">
              <ImageIcon className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Logo upload</p>
              <p className="text-xs text-gray-500">JPEG, PNG, WebP · max 5 MB</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            A default placeholder is used until you upload a custom logo.
          </p>
        </div>
      </aside>
    </div>
  );
}
