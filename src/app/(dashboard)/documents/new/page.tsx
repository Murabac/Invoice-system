import { Header } from "@/components/layout/Header";
import { DocumentWorkspace } from "@/components/documents/DocumentWorkspace";
import { getClients, seedDefaultClient } from "@/lib/actions/clients";
import { getNextDocumentNumber } from "@/lib/actions/documents";
import { getProfile } from "@/lib/actions/profiles";
import type { DocumentType } from "@/lib/types/database";

interface NewDocumentPageProps {
  searchParams: { type?: string };
}

export default async function NewDocumentPage({
  searchParams,
}: NewDocumentPageProps) {
  await seedDefaultClient();

  const type = (
    searchParams.type === "invoice" ? "invoice" : "quotation"
  ) as DocumentType;

  const [clients, profile, documentNumber] = await Promise.all([
    getClients(),
    getProfile(),
    getNextDocumentNumber(type),
  ]);

  return (
    <>
      <Header
        title="New Document"
        description="Create a quotation or invoice with live preview"
      />
      <DocumentWorkspace
        clients={clients}
        profile={profile}
        defaultDocumentNumber={documentNumber}
        defaultType={type}
      />
    </>
  );
}
