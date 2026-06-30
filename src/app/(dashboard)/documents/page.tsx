import Link from "next/link";
import { Suspense } from "react";
import { Header } from "@/components/layout/Header";
import { DocumentsTable } from "@/components/documents/DocumentsTable";
import { Button } from "@/components/ui/Button";
import { getDocuments } from "@/lib/actions/documents";
import type { DocumentStatus, DocumentType } from "@/lib/types/database";

interface DocumentsPageProps {
  searchParams: { type?: string; status?: string };
}

async function DocumentsContent({
  type,
  status,
}: {
  type: DocumentType | "all";
  status: DocumentStatus | "all";
}) {
  const documents = await getDocuments({ type, status });
  return <DocumentsTable documents={documents} />;
}

function DocumentsTableSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="flex gap-4">
        <div className="h-16 w-44 rounded-lg bg-gray-200" />
        <div className="h-16 w-44 rounded-lg bg-gray-200" />
      </div>
      <div className="h-64 rounded-xl border border-gray-200 bg-gray-50" />
    </div>
  );
}

export default function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const type = (searchParams.type ?? "all") as DocumentType | "all";
  const status = (searchParams.status ?? "all") as DocumentStatus | "all";

  return (
    <>
      <Header
        title="Documents"
        description="Manage quotations and invoices"
        actions={
          <Link href="/documents/new">
            <Button>New Document</Button>
          </Link>
        }
      />
      <div className="flex-1 overflow-y-auto p-8">
        <Suspense
          key={`${type}-${status}`}
          fallback={<DocumentsTableSkeleton />}
        >
          <DocumentsContent type={type} status={status} />
        </Suspense>
      </div>
    </>
  );
}
