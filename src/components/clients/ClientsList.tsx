"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Building2,
  Check,
  MapPin,
  Pencil,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";
import { ClientLogoUpload } from "./ClientLogoUpload";
import { deleteClient, updateClient } from "@/lib/actions/clients";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { Client } from "@/lib/types/database";

interface ClientsListProps {
  clients: Client[];
}

export function ClientsList({ clients }: ClientsListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [logoUrls, setLogoUrls] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      clients.filter((c) => c.logo_url).map((c) => [c.id, c.logo_url as string])
    )
  );
  const [error, setError] = useState<string | null>(null);

  function startEdit(client: Client) {
    setEditingId(client.id);
    setEditName(client.name);
    setEditAddress(client.address ?? "");
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditAddress("");
    setError(null);
  }

  function saveEdit(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateClient(id, {
        name: editName,
        address: editAddress,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditingId(null);
      router.refresh();
    });
  }

  function handleDelete(id: string, name: string) {
    if (
      !confirm(
        `Delete "${name}"? Documents linked to this client will keep but lose the client reference.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteClient(id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (clients.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 bg-surface px-8 py-16 text-center shadow-card">
        <div className="rounded-2xl bg-primary/10 p-4">
          <Building2 className="h-8 w-8 text-primary" />
        </div>
        <h3 className="mt-6 text-lg font-semibold text-gray-900">
          No clients yet
        </h3>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          Add your first client to start assigning them to quotations and
          invoices.
        </p>
        <Link href="/clients/new" className="mt-8">
          <Button>
            <UserPlus className="h-4 w-4" />
            Add Your First Client
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-surface px-5 py-4 shadow-card">
        <div>
          <p className="text-sm font-medium text-gray-500">Total clients</p>
          <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
        </div>
        <Link href="/clients/new">
          <Button variant="outline" size="sm">
            <UserPlus className="h-4 w-4" />
            Add Client
          </Button>
        </Link>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        {clients.map((client) => {
          const logoUrl = logoUrls[client.id] ?? client.logo_url;
          const isEditing = editingId === client.id;

          return (
            <article
              key={client.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-card transition-shadow hover:shadow-md"
            >
              {isEditing ? (
                <div className="space-y-4 p-6">
                  <Input
                    label="Client Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <Input
                    label="Address"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                  />
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => saveEdit(client.id)}
                      disabled={isPending}
                    >
                      <Check className="h-4 w-4" />
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={cancelEdit}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="border-b border-gray-100 bg-gradient-to-r from-gray-50 to-white px-6 py-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-4">
                        <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                          <Image
                            src={logoUrl || "/client.png"}
                            alt={client.name}
                            fill
                            className="object-contain p-1.5"
                            unoptimized={Boolean(logoUrl?.startsWith("http"))}
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate font-semibold text-gray-900">
                            {client.name}
                          </h3>
                          {client.address ? (
                            <p className="mt-1.5 flex items-start gap-1.5 text-sm text-gray-500">
                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                              <span className="whitespace-pre-line line-clamp-2">
                                {client.address}
                              </span>
                            </p>
                          ) : (
                            <p className="mt-1.5 text-sm italic text-gray-400">
                              No address added
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(client)}
                          disabled={isPending}
                          aria-label={`Edit ${client.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(client.id, client.name)}
                          disabled={isPending}
                          aria-label={`Delete ${client.name}`}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <ClientLogoUpload
                      clientId={client.id}
                      clientName={client.name}
                      logoUrl={logoUrl}
                      onLogoUpdated={(url) =>
                        setLogoUrls((prev) => ({ ...prev, [client.id]: url }))
                      }
                    />
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
