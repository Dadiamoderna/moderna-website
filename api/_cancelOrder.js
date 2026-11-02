// The server-side half of "cancel an order". Putting an order's shoes back in
// Stockroom needs a secret that only this server holds, so a customer can never
// trigger it. Only the signed-in admin gets here (the order table's own rules
// are checked with their login), and nothing else can undo an order.
//
// `deps` exists so this can be tested without real databases.
const ACTIVE = ["new", "confirmed"];

export async function cancelAndRestock({ orderId }, deps) {
  const { data: order, error: readError } = await deps.orders.find(orderId);
  if (readError) return { status: 500, body: { ok: false, reason: "error", detail: readError.message } };
  if (!order || !ACTIVE.includes(order.status)) {
    return { status: 409, body: { ok: false, reason: "changed" } };
  }

  // Claim the cancellation first (only if nobody changed the order meanwhile),
  // so it can only ever happen once, even with a double click.
  const { data: claimed, error: claimError } = await deps.orders.setStatus(orderId, order.status, "cancelled");
  if (claimError) return { status: 500, body: { ok: false, reason: "error", detail: claimError.message } };
  if (!claimed) return { status: 409, body: { ok: false, reason: "changed" } };

  // Put the shoes back. If that fails, undo the cancellation so the order and
  // the stock never disagree.
  const restock = await deps.restock(order.reference);
  if (!restock.ok) {
    await deps.orders.setStatus(orderId, "cancelled", order.status);
    return { status: 502, body: { ok: false, reason: "restock", detail: restock.detail } };
  }
  return { status: 200, body: { ok: true, restored: restock.restored } };
}
