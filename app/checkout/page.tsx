import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CheckoutForm from "./CheckoutForm";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/checkout");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-center font-serif text-3xl italic text-ink">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
