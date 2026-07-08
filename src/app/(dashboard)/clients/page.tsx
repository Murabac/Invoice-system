import Link from "next/link";
import { UserPlus } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { ClientsList } from "@/components/clients/ClientsList";
import { Button } from "@/components/ui/Button";
import { getClients } from "@/lib/actions/clients";

export default async function ClientsListPage() {
  const clients = await getClients();

  return (
    <>
      <Header
        title="Clients List"
        description="View and manage your billing clients"
        actions={
          <Link href="/clients/new">
            <Button>
              <UserPlus className="h-4 w-4" />
              Add Client
            </Button>
          </Link>
        }
      />
      <div className="page-content">
        <div className="mx-auto max-w-5xl">
          <ClientsList clients={clients} />
        </div>
      </div>
    </>
  );
}
