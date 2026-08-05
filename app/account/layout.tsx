import Link from "next/link";
import { signOut } from "@/lib/actions/auth";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between border-b border-hairline pb-4">
        <h1 className="font-serif text-2xl italic text-ink">My Account</h1>
        <nav className="flex items-center gap-4 text-xs uppercase tracking-widest text-stone">
          <Link href="/" className="hover:text-gold">
            Continue Shopping
          </Link>
          <form action={async () => { "use server"; await signOut("/"); }}>
            <button type="submit" className="hover:text-gold">
              Sign out
            </button>
          </form>
        </nav>
      </header>
      {children}
    </div>
  );
}
