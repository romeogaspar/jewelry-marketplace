"use server";

import { createClient } from "../supabase/server";
import { createServiceClient } from "../supabase/service";
import { getPaymentProvider } from "../payments";

export type CartLineInput = {
  productId: string;
  variantId: string | null;
  quantity: number;
};

export type ShippingInput = {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
};

export type CheckoutResult =
  | { error: string }
  | { orderId: string; clientSecret: string; totalAmount: number };

export async function createCheckout(
  lines: CartLineInput[],
  shipping: ShippingInput
): Promise<CheckoutResult> {
  if (lines.length === 0) {
    return { error: "Your cart is empty." };
  }
  if (!shipping.name || !shipping.addressLine1 || !shipping.city || !shipping.country) {
    return { error: "Please fill in your shipping address." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Please sign in to check out." };
  }

  // Re-fetch authoritative price, stock, and commission server-side — the
  // cart in localStorage is never trusted for money math. This uses the
  // service client rather than the customer's own session: vendors.
  // commission_pct/is_approved aren't columns a customer's RLS-scoped
  // client can read (vendors_select only allows a vendor's own row or an
  // admin), so this verification step is inherently a system operation.
  const serviceClient = createServiceClient();
  const productIds = [...new Set(lines.map((l) => l.productId))];
  const { data: products } = await serviceClient
    .from("products")
    .select("id, title, base_price, stock, status, vendor_id, vendors(commission_pct, is_approved)")
    .in("id", productIds);

  if (!products || products.length === 0) {
    return { error: "Could not verify your cart contents." };
  }

  const variantIds = lines
    .map((l) => l.variantId)
    .filter((id): id is string => Boolean(id));
  const { data: variants } =
    variantIds.length > 0
      ? await serviceClient
          .from("product_variants")
          .select("id, product_id, metal_type, price_delta, stock")
          .in("id", variantIds)
      : { data: [] };

  const productById = new Map(products.map((p) => [p.id, p]));
  const variantById = new Map((variants ?? []).map((v) => [v.id, v]));

  let totalAmount = 0;
  const orderItems: Record<string, unknown>[] = [];

  for (const line of lines) {
    const product = productById.get(line.productId);
    if (!product || product.status !== "approved") {
      return { error: `"${product?.title ?? "An item"}" is no longer available.` };
    }

    const vendor = Array.isArray(product.vendors) ? product.vendors[0] : product.vendors;
    if (!vendor?.is_approved) {
      return { error: `"${product.title}" is no longer available.` };
    }

    const variant = line.variantId ? variantById.get(line.variantId) : null;
    if (line.variantId && !variant) {
      return { error: `A variant of "${product.title}" is no longer available.` };
    }

    const availableStock = variant ? variant.stock : product.stock;
    if (line.quantity > availableStock) {
      return { error: `Not enough stock for "${product.title}".` };
    }

    const unitPrice = product.base_price + (variant?.price_delta ?? 0);
    const lineTotal = Math.round(unitPrice * line.quantity * 100) / 100;
    const commissionPct = vendor.commission_pct;
    const commissionAmount = Math.round(lineTotal * commissionPct) / 100;
    const vendorEarning = Math.round((lineTotal - commissionAmount) * 100) / 100;

    totalAmount += lineTotal;

    orderItems.push({
      vendor_id: product.vendor_id,
      product_id: product.id,
      variant_id: variant?.id ?? null,
      product_title_snapshot: product.title,
      metal_type_snapshot: variant?.metal_type ?? null,
      unit_price: unitPrice,
      quantity: line.quantity,
      line_total: lineTotal,
      commission_pct_snapshot: commissionPct,
      commission_amount: commissionAmount,
      vendor_earning: vendorEarning,
    });
  }

  totalAmount = Math.round(totalAmount * 100) / 100;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      customer_id: user.id,
      total_amount: totalAmount,
      currency: "usd",
      shipping_name: shipping.name,
      shipping_address_line1: shipping.addressLine1,
      shipping_address_line2: shipping.addressLine2 || null,
      shipping_city: shipping.city,
      shipping_state: shipping.state || null,
      shipping_postal_code: shipping.postalCode || null,
      shipping_country: shipping.country,
      shipping_phone: shipping.phone || null,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    return { error: orderError?.message ?? "Could not create your order." };
  }

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));

  if (itemsError) {
    return { error: itemsError.message };
  }

  const provider = getPaymentProvider();
  const intent = await provider.createPaymentIntent({
    amountMinorUnits: Math.round(totalAmount * 100),
    currency: "usd",
    metadata: { orderId: order.id },
  });

  // No orders_update RLS policy exists for the customer-scoped client — by
  // design, a customer can only ever INSERT their own order; every update
  // (this linkage, payment_status, fulfillment) is a system operation that
  // goes through the service client instead.
  await serviceClient
    .from("orders")
    .update({ stripe_payment_intent_id: intent.providerIntentId })
    .eq("id", order.id);

  return { orderId: order.id, clientSecret: intent.clientSecret, totalAmount };
}
