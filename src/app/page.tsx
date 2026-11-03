import { redirect } from "next/navigation";
import { getUser } from "@/lib/actions/auth";

export default async function HomePage() {
  try {
    const user = await getUser();
    redirect(user ? "/dashboard" : "/login");
  } catch {
    // Misconfigured env (common on Coolify if NEXT_PUBLIC_* were not build args)
    redirect("/login");
  }
}
