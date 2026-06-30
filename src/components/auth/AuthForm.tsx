"use client";

import { useState } from "react";
import { signIn } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function AuthForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signIn(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">Biloop</h1>
          <p className="mt-1 text-sm text-gray-500">Technology Innovators</p>
          <p className="mt-4 text-lg font-semibold text-gray-900">
            Sign in to your account
          </p>
        </div>

        <form
          action={handleSubmit}
          className="space-y-4 rounded-2xl border border-gray-200 bg-surface p-8 shadow-panel"
        >
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="you@company.com"
            required
          />

          <Input
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            minLength={6}
            required
          />

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Please wait…" : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
