import Link from "next/link";
import { signOut } from "@/lib/actions/auth";

export default function AdminPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // proxy.ts already gates every /admin/* route (other than /admin/setup) to
  // role === 'admin', so this layout only needs to render shared chrome.
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-400">
            Admin
          </p>
          <h1 className="text-lg font-semibold text-neutral-900">
            Marketplace Control Panel
          </h1>
        </div>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
          <Link href="/admin/dashboard" className="text-neutral-600 hover:text-neutral-900">
            Dashboard
          </Link>
          <Link href="/admin/vendors" className="text-neutral-600 hover:text-neutral-900">
            Vendors
          </Link>
          <Link href="/admin/products/pending" className="text-neutral-600 hover:text-neutral-900">
            Product Queue
          </Link>
          <Link href="/admin/categories" className="text-neutral-600 hover:text-neutral-900">
            Categories
          </Link>
          <Link href="/admin/orders" className="text-neutral-600 hover:text-neutral-900">
            Orders
          </Link>
          <Link href="/admin/payouts" className="text-neutral-600 hover:text-neutral-900">
            Payouts
          </Link>
          <form action={async () => { "use server"; await signOut("/login"); }}>
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
