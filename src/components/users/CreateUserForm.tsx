"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { UserPlus } from "lucide-react";
import { createAdminUser } from "@/lib/actions/users";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CreateUserForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const company_name = formData.get("company_name") as string;

    startTransition(async () => {
      const result = await createAdminUser({ email, password, company_name });
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess("Admin user created successfully.");
      form.reset();
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-gray-200 bg-surface p-6 shadow-card"
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <UserPlus className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Create Admin</h2>
          <p className="text-sm text-gray-500">
            New users are created as admins with access to the main app.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Email"
          name="email"
          type="email"
          placeholder="admin@company.com"
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          placeholder="Minimum 6 characters"
          minLength={6}
          required
        />
        <div className="sm:col-span-2">
          <Input
            label="Company Name"
            name="company_name"
            placeholder="Biloop Technology Innovators"
          />
        </div>
      </div>

      <Button type="submit" className="mt-6" disabled={isPending}>
        {isPending ? "Creating…" : "Create Admin User"}
      </Button>
    </form>
  );
}
