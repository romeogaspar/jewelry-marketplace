"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/store/cartStore";

// The cart is a browser-local (localStorage) Zustand store with no idea
// which account is signed in — so on a shared browser, switching from one
// signed-in account to another otherwise leaves the previous account's cart
// items sitting there for the new account to check out with. This clears
// the cart whenever the authenticated identity actually changes.
export default function CartAuthSync() {
  const clear = useCartStore((s) => s.clear);
  const lastUserId = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const supabase = createClient();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUserId = session?.user?.id ?? null;

      // First callback just establishes the baseline (e.g. on page load
      // with an existing session) — nothing to compare against yet, so
      // don't wipe the cart just because the listener fired once.
      if (lastUserId.current !== undefined && lastUserId.current !== currentUserId) {
        clear();
      }

      lastUserId.current = currentUserId;
    });

    return () => subscription.subscription.unsubscribe();
  }, [clear]);

  return null;
}
