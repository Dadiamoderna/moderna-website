import { supabase } from "./supabaseClient";
import { restockOrder } from "./inventory";

// No .select() on purpose: customers may insert orders but aren't allowed to
// read them back, and asking for the saved row makes Supabase reject the insert.
export async function createOrder({
  items,
  subtotal,
  fulfillment,
  customerName,
  phone,
  address,
  reference,
}) {
  const { error } = await supabase.from("orders").insert({
    items,
    subtotal,
    fulfillment,
    customer_name: customerName,
    phone,
    address,
    reference,
  });
  if (error) throw error;
}

export async function fetchOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function updateOrderStatus(id, status) {
  const { error } = await supabase.from("orders").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function deleteOrder(id) {
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw error;
}

// Cancels an active order and puts its shoes back in Stockroom.
//  1. Claim the cancellation first (only a new/confirmed order can be claimed),
//     so it can only ever happen once, even with a double click.
//  2. Put the shoes back. If that fails, undo the cancellation so the order and
//     the stock never disagree, and report the problem.
// `deps` exists so this can be tested without a real database.
export async function cancelOrder(order, deps = { db: supabase, restock: restockOrder }) {
  const { data, error } = await deps.db
    .from("orders")
    .update({ status: "cancelled" })
    .eq("id", order.id)
    .in("status", ["new", "confirmed"])
    .select("id")
    .maybeSingle();
  if (error) throw error;
  if (!data) return { ok: false, reason: "changed" };

  const restock = await deps.restock(order.reference);
  if (!restock.ok) {
    await deps.db
      .from("orders")
      .update({ status: order.status })
      .eq("id", order.id)
      .eq("status", "cancelled");
    return { ok: false, reason: "restock", detail: restock.detail };
  }
  return { ok: true, restored: restock.restored };
}
