import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import Button from "@/components/ui/Button";

export default async function VendorPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts already redirects unauthenticated/wrong-role visitors away from
  // /vendor/*, so reaching this point means role === 'vendor'. This layout's
  // own job is the finer-grained "pending approval" screen, which needs a
  // friendly in-app message rather than a redirect loop.
  if (!user) {
    redirect("/vendor/login");
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("business_name, is_approved")
    .eq("id", user.id)
    .single();

  if (!vendor?.is_approved) {
    return (
      <div className="mx-auto mt-16 max-w-md px-4 text-center">
        <h1 className="text-xl font-semibold text-neutral-900">
          Awaiting Approval
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Thanks for registering, {vendor?.business_name}. An admin needs to
          approve your vendor account before you can access your dashboard or
          list products.
        </p>
        <form action={async () => { "use server"; await signOut("/vendor/login"); }} className="mt-6">
          <Button type="submit" variant="secondary">
            Sign out
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">
            Vendor Portal
          </p>
          <h1 className="text-lg font-semibold text-neutral-900">
            {vendor.business_name}
          </h1>
        </div>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Link href="/vendor/dashboard" className="text-neutral-600 hover:text-neutral-900">
            Dashboard
          </Link>
          <Link href="/vendor/products" className="text-neutral-600 hover:text-neutral-900">
            Products
          </Link>
          <Link href="/vendor/orders" className="text-neutral-600 hover:text-neutral-900">
            Orders
          </Link>
          <Link href="/vendor/payouts" className="text-neutral-600 hover:text-neutral-900">
            Payouts
          </Link>
          <Link href="/vendor/notifications" className="text-neutral-600 hover:text-neutral-900">
            Notifications
          </Link>
          <form action={async () => { "use server"; await signOut("/vendor/login"); }}>
            <button type="submit" className="text-neutral-600 hover:text-neutral-900">
              Sign out
            </button>
          </form>
        </nav>
      </header>
      {children}
    </div>
  );
}
