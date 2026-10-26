import { Header } from "@/components/layout/Header";
import { CompanyVaultManager } from "@/components/vault/CompanyVaultManager";
import {
  getVaultSetupStatus,
  listVaultEntries,
} from "@/lib/actions/vault";

export default async function VaultPage() {
  const [entries, setup] = await Promise.all([
    listVaultEntries(),
    getVaultSetupStatus(),
  ]);

  return (
    <>
      <Header
        title="Secure vault"
        description="Encrypted storage for passwords, company IDs, and registered addresses"
      />
      <div className="page-content">
        <CompanyVaultManager
          entries={entries}
          encryptionConfigured={setup.encryptionConfigured}
        />
      </div>
    </>
  );
}
