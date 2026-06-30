"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Shield, Trash2, User } from "lucide-react";
import { deleteAdminUser, type UserListItem } from "@/lib/actions/users";
import { roleLabel } from "@/lib/auth/roles";
import { Button } from "@/components/ui/Button";

interface UsersListProps {
  users: UserListItem[];
  currentUserId: string;
}

export function UsersList({ users, currentUserId }: UsersListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(userId: string, email: string | null) {
    if (!confirm(`Delete user ${email ?? userId}? This cannot be undone.`)) {
      return;
    }

    startTransition(async () => {
      const result = await deleteAdminUser(userId);
      if (result.error) {
        alert(result.error);
        return;
      }
      router.refresh();
    });
  }

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-surface p-12 text-center text-gray-500">
        No users found.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-surface shadow-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-surface-muted/50 text-left">
            <th className="px-6 py-3 font-semibold text-gray-700">User</th>
            <th className="px-6 py-3 font-semibold text-gray-700">Role</th>
            <th className="px-6 py-3 font-semibold text-gray-700">Created</th>
            <th className="px-6 py-3 font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            const isSuper = user.role === "super_admin";

            return (
              <tr
                key={user.id}
                className="border-b border-gray-100 last:border-0 hover:bg-gray-50/50"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gray-100 p-2">
                      {isSuper ? (
                        <Shield className="h-4 w-4 text-primary" />
                      ) : (
                        <User className="h-4 w-4 text-gray-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user.email ?? "—"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.company_name ?? "—"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      isSuper
                        ? "bg-primary/10 text-primary"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {roleLabel(user.role)}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  {!isSuper && !isSelf && (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => handleDelete(user.id, user.email)}
                      className="text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
