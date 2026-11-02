import { supabase } from "./supabaseClient";

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

// Cancels an active order and puts its shoes back in Stockroom. This is done
// by our own server (api/cancel-order.js), not the browser: putting stock back
// needs a secret the browser never has, so customers can't do it, and it only
// accepts the signed-in admin. If the shoes can't be put back, the server leaves
// the order un-cancelled so the order and the stock never disagree.
// Returns { ok: true, restored } or { ok: false, reason, detail }.
// `deps` exists so this can be tested without a real server.
export async function cancelOrder(order, deps = {}) {
  const getToken =
    deps.getToken ?? (async () => (await supabase.auth.getSession()).data.session?.access_token);
  const send = deps.fetch ?? fetch;

  const token = await getToken();
  if (!token) throw new Error("You're signed out. Please log in again.");

  const response = await send("/api/cancel-order", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderId: order.id }),
  });
  const body = await response.json().catch(() => null);

  if (response.status === 401) throw new Error("You're signed out. Please log in again.");
  if (!body) throw new Error("Couldn't reach the server. Please try again.");
  return body;
}
