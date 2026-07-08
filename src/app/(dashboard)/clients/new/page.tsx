import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { AddClientForm } from "@/components/clients/AddClientForm";

export default function AddClientPage() {
  return (
    <>
      <Header
        title="Add Client"
        description="Create a new client for quotations and invoices"
      />
      <div className="page-content">
        <div className="mx-auto max-w-4xl">
          <Link
            href="/clients"
            className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Clients List
          </Link>
          <AddClientForm />
        </div>
      </div>
    </>
  );
}
