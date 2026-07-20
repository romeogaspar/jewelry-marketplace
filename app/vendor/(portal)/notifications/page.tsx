import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { markNotificationRead } from "@/lib/actions/notifications";
import Badge from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function VendorNotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, link_href, is_read, created_at")
    .eq("recipient_id", user!.id)
    .order("created_at", { ascending: false });

  const all = notifications ?? [];

  return (
    <div>
      <h2 className="text-lg font-semibold text-neutral-900">Notifications</h2>

      <div className="mt-4 space-y-2">
        {all.length === 0 ? (
          <p className="text-sm text-neutral-500">Nothing yet.</p>
        ) : (
          all.map((n) => (
            <div
              key={n.id}
              className={`flex items-start justify-between gap-4 rounded-lg border p-3 ${
                n.is_read ? "border-neutral-200" : "border-neutral-900"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  {!n.is_read && <Badge tone="blue">New</Badge>}
                  <p className="text-sm font-medium text-neutral-900">{n.title}</p>
                </div>
                {n.body && <p className="mt-1 text-sm text-neutral-600">{n.body}</p>}
                <p className="mt-1 text-xs text-neutral-400">
                  {new Date(n.created_at).toLocaleString()}
                </p>
                {n.link_href && (
                  <Link href={n.link_href} className="text-xs text-neutral-600 underline">
                    View
                  </Link>
                )}
              </div>
              {!n.is_read && (
                <form action={markNotificationRead}>
                  <input type="hidden" name="id" value={n.id} />
                  <button type="submit" className="text-xs text-neutral-500 hover:text-neutral-900">
                    Mark read
                  </button>
                </form>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
