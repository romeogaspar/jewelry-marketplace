import { redirect } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/service";
import SetupForm from "./SetupForm";

export const dynamic = "force-dynamic";

export default async function AdminSetupPage() {
  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.listUsers();

  // Once any admin exists, this page is no longer available — send people
  // to sign in instead of letting setup be replayed.
  if (!error && data.users.length > 0) {
    redirect("/login");
  }

  return (
    <div className="mx-auto mt-16 w-full max-w-sm px-4">
      <h1 className="text-xl font-semibold text-neutral-900">Set Up Admin</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Create the first admin account for this marketplace.
      </p>
      <SetupForm />
    </div>
  );
}
