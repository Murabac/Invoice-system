import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { DocumentWorkspace } from "@/components/documents/DocumentWorkspace";
import { getClients } from "@/lib/actions/clients";
import { getDocument } from "@/lib/actions/documents";
import { getProfile } from "@/lib/actions/profiles";

interface DocumentDetailPageProps {
  params: { id: string };
}

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const { id } = params;

  const [document, clients, profile] = await Promise.all([
    getDocument(id),
    getClients(),
    getProfile(),
  ]);

  if (!document) notFound();

  return (
    <>
      <Header
        title={`${document.type === "quotation" ? "Quotation" : "Invoice"} ${document.document_number}`}
        description={`Status: ${document.status}`}
      />
      <DocumentWorkspace
        clients={clients}
        profile={profile}
        initialDocument={document}
        defaultDocumentNumber={document.document_number}
        defaultType={document.type}
      />
    </>
  );
}
