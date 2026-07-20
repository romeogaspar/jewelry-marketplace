import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { ShippingLabelDocument } from "@/lib/pdf/shipping-label";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  // proxy.ts already gates /vendor/* to role='vendor', but this route
  // returns a binary file rather than a gated page, so it re-checks
  // ownership explicitly rather than only relying on RLS.
  const { data: item } = await supabase
    .from("order_items")
    .select(
      "id, vendor_id, product_title_snapshot, metal_type_snapshot, quantity, order_id, orders(shipping_name, shipping_address_line1, shipping_address_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country, shipping_phone)"
    )
    .eq("id", id)
    .single();

  if (!item || item.vendor_id !== user.id) {
    return new Response("Not found", { status: 404 });
  }

  const order = Array.isArray(item.orders) ? item.orders[0] : item.orders;
  if (!order) {
    return new Response("Not found", { status: 404 });
  }

  const { data: vendor } = await supabase
    .from("vendors")
    .select("business_name, address_line1, city, country")
    .eq("id", user.id)
    .single();

  const buffer = await renderToBuffer(
    ShippingLabelDocument({
      orderId: item.order_id,
      from: {
        businessName: vendor?.business_name ?? "",
        addressLine1: vendor?.address_line1 ?? null,
        city: vendor?.city ?? null,
        country: vendor?.country ?? null,
      },
      to: {
        name: order.shipping_name,
        addressLine1: order.shipping_address_line1,
        addressLine2: order.shipping_address_line2,
        city: order.shipping_city,
        state: order.shipping_state,
        postalCode: order.shipping_postal_code,
        country: order.shipping_country,
        phone: order.shipping_phone,
      },
      items: [
        {
          title: item.product_title_snapshot,
          metalType: item.metal_type_snapshot,
          quantity: item.quantity,
        },
      ],
    })
  );

  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="label-${item.id.slice(0, 8)}.pdf"`,
    },
  });
}
