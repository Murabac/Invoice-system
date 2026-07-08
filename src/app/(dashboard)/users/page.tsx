import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { CreateUserForm } from "@/components/users/CreateUserForm";
import { UsersList } from "@/components/users/UsersList";
import { getProfile } from "@/lib/actions/profiles";
import { listUsers } from "@/lib/actions/users";
import { isSuperAdmin } from "@/lib/auth/roles";
import { getAuthUser } from "@/lib/supabase/get-user";

export default async function UsersPage() {
  const [user, profile] = await Promise.all([getAuthUser(), getProfile()]);

  if (!profile || !isSuperAdmin(profile.role)) {
    redirect("/dashboard");
  }

  const users = await listUsers();

  return (
    <>
      <Header
        title="Users"
        description="Create and manage admin accounts for the system"
      />
      <div className="page-content">
        <div className="mx-auto max-w-4xl space-y-6">
          <CreateUserForm />
          <UsersList users={users} currentUserId={user!.id} />
        </div>
      </div>
    </>
  );
}
