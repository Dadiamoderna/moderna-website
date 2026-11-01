import { STORE } from "../config";

// Short code the customer can quote, e.g. MOD-7K3PQ2. Skips look-alike
// characters (0/O, 1/I) so it's easy to read out over the phone.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function makeReference() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return "MOD-" + Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

function lineText(item) {
  const variant = [item.size && `size ${item.size}`, item.color].filter(Boolean).join(", ");
  return `${item.name}${variant ? ` (${variant})` : ""} x ${item.quantity}`;
}

// A WhatsApp chat to the shop with the order already typed in, so the customer
// has a copy and an easy way to reach you.
export function whatsappConfirmLink(order) {
  const how = order.fulfillment === "delivery" ? "Delivery" : "Pickup from KOURA";
  const lines = [
    `Hi Moderna! I just placed order ${order.reference}.`,
    "",
    ...order.items.map((i) => `- ${lineText(i)}`),
    "",
    `Total: ${STORE.currency}${order.subtotal.toFixed(2)} (${how}, cash)`,
  ];
  if (order.name) lines.push(`Name: ${order.name}`);
  return `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(lines.join("\n"))}`;
}

export { lineText };
