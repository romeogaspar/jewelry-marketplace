import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import CartLink from "./storefront/CartLink";
import CategoryNav from "./storefront/CategoryNav";

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
    <header className="border-b border-hairline bg-parchment">
      <div className="mx-auto grid max-w-6xl grid-cols-3 items-center gap-3 px-4 py-5">
        <nav className="hidden justify-self-start text-xs font-medium uppercase tracking-widest text-stone sm:flex sm:items-center sm:gap-5">
          {!user && (
            <Link href="/vendor/login" className="whitespace-nowrap hover:text-gold">
              Sell With Us
            </Link>
          )}
          {user && role === "vendor" && (
            <Link href="/vendor/dashboard" className="whitespace-nowrap hover:text-gold">
              Vendor Dashboard
            </Link>
          )}
          {user && role === "admin" && (
            <Link href="/admin/dashboard" className="whitespace-nowrap hover:text-gold">
              Admin Dashboard
            </Link>
          )}
        </nav>

        <Link
          href="/"
          className="col-start-2 justify-self-center font-serif text-2xl tracking-tight text-ink sm:text-3xl"
        >
          Cessyrona
        </Link>

        <nav className="col-start-3 flex items-center justify-self-end gap-x-5 whitespace-nowrap text-xs font-medium uppercase tracking-widest text-stone">
          {!user && (
            <Link href="/login" className="hover:text-gold">
              Sign In
            </Link>
          )}
          {user && role === "customer" && (
            <>
              <Link href="/account" className="hover:text-gold">
                Account
              </Link>
              <form action={async () => { "use server"; await signOut("/"); }}>
                <button type="submit" className="hover:text-gold">
                  Sign Out
                </button>
              </form>
            </>
          )}
          <CartLink />
        </nav>
      </div>
      <CategoryNav />
    </header>
  );
}
