import { supabase } from "./supabaseClient";

// No .select() on purpose: customers may insert orders but aren't allowed to
// read them back, and asking for the saved row makes Supabase reject the insert.
export async function createOrder({ items, subtotal, fulfillment, customerName, phone, address }) {
  const { error } = await supabase.from("orders").insert({
    items,
    subtotal,
    fulfillment,
    customer_name: customerName,
    phone,
    address,
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
