import { AuthForm } from "@/components/auth/AuthForm";
import { isQuickSuperAdminLoginAvailable } from "@/lib/actions/auth";

export default async function LoginPage() {
  const showQuickSuperAdminLogin = await isQuickSuperAdminLoginAvailable();

  return <AuthForm showQuickSuperAdminLogin={showQuickSuperAdminLogin} />;
}
