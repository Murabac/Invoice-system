import Link from "next/link";
import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";

export default function AccountPendingPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-surface p-8 text-center shadow-card">
        <h1 className="text-xl font-bold text-primary">Account pending</h1>
        <p className="mt-3 text-sm text-gray-600">
          Your account is not activated yet. Contact your M2B administrator to
          get access.
        </p>
        <form action={signOut} className="mt-6">
          <Button type="submit" variant="outline" className="w-full">
            Sign out
          </Button>
        </form>
        <p className="mt-4 text-xs text-gray-500">
          <Link href="/login" className="text-primary hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
