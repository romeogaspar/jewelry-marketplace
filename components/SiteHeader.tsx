import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import CartLink from "./storefront/CartLink";

export default async function SiteHeader() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let role: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    role = profile?.role ?? null;
  }

  return (
    <header className="border-b border-neutral-200">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-neutral-900">
          Jewelry Marketplace by Cessyrona
        </Link>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-600">
          <CartLink />
          {!user && (
            <>
              <Link href="/vendor/login" className="whitespace-nowrap hover:text-neutral-900">
                Sell with us
              </Link>
              <Link href="/login" className="whitespace-nowrap hover:text-neutral-900">
                Sign in
              </Link>
            </>
          )}
          {user && role === "customer" && (
            <>
              <Link href="/account" className="whitespace-nowrap hover:text-neutral-900">
                My Account
              </Link>
              <form action={async () => { "use server"; await signOut("/"); }}>
                <button type="submit" className="whitespace-nowrap hover:text-neutral-900">
                  Sign out
                </button>
              </form>
            </>
          )}
          {user && role === "vendor" && (
            <Link href="/vendor/dashboard" className="whitespace-nowrap hover:text-neutral-900">
              Vendor Dashboard
            </Link>
          )}
          {user && role === "admin" && (
            <Link href="/admin/dashboard" className="whitespace-nowrap hover:text-neutral-900">
              Admin Dashboard
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
