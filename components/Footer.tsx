import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { browseCategories, type CategoryNode } from "@/lib/categoryTree";

export default async function Footer() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("id, parent_id, slug, name, level, sort_order")
    .eq("is_active", true);

  const categories = browseCategories((data ?? []) as CategoryNode[]);

  return (
    <footer className="border-t border-hairline bg-parchment-deep">
      <div className="mx-auto max-w-6xl px-4 py-14">
        <div className="flex flex-col items-center gap-3 border-b border-hairline pb-10 text-center">
          <p className="font-serif text-2xl italic text-ink">Join the list</p>
          <p className="max-w-md text-sm text-stone">
            New arrivals, maker stories, and early access to limited pieces —
            straight to your inbox.
          </p>
          <form className="mt-2 flex w-full max-w-sm gap-2">
            <input
              type="email"
              placeholder="Email address"
              aria-label="Email address"
              className="w-full border border-hairline bg-parchment px-3 py-2 text-sm text-ink placeholder:text-stone focus:border-gold focus:outline-none"
            />
            <button
              type="submit"
              className="shrink-0 border border-ink px-4 py-2 text-xs font-medium uppercase tracking-widest text-ink transition-colors hover:bg-ink hover:text-parchment"
            >
              Subscribe
            </button>
          </form>
        </div>

        <div className="grid grid-cols-2 gap-8 pt-10 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-stone">
              Shop
            </p>
            <ul className="mt-4 space-y-2 text-ink">
              {categories.map((c) => (
                <li key={c.id}>
                  <Link href={`/category/${c.path}`} className="hover:text-gold">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-stone">
              Client Care
            </p>
            <ul className="mt-4 space-y-2 text-ink">
              <li><Link href="/account" className="hover:text-gold">My Account</Link></li>
              <li><Link href="/cart" className="hover:text-gold">Cart</Link></li>
              <li><Link href="/login" className="hover:text-gold">Sign In</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-stone">
              The House
            </p>
            <ul className="mt-4 space-y-2 text-ink">
              <li><Link href="/" className="hover:text-gold">Our Story</Link></li>
              <li><Link href="/vendor/login" className="hover:text-gold">Sell With Us</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-stone">
              Follow
            </p>
            <ul className="mt-4 space-y-2 text-ink">
              <li><a href="#" className="hover:text-gold">Instagram</a></li>
              <li><a href="#" className="hover:text-gold">Pinterest</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-2 border-t border-hairline pt-6 text-xs text-stone sm:flex-row">
          <p>&copy; {new Date().getFullYear()} Cessyrona Jewelry. A Cessyrona Software Studio demo.</p>
          <p className="uppercase tracking-widest">Hand-approved, always.</p>
        </div>
      </div>
    </footer>
  );
}
