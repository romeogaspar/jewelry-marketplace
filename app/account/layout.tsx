import Link from "next/link";
import { signOut } from "@/lib/actions/auth";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between border-b border-neutral-200 pb-4">
        <h1 className="text-lg font-semibold text-neutral-900">My Account</h1>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-neutral-600 hover:text-neutral-900">
            Continue Shopping
          </Link>
          <form action={async () => { "use server"; await signOut("/"); }}>
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
