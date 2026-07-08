import { STORE } from "../config";

export function buildOrderMessage(items, subtotal) {
  const lines = [
    `Hi Moderna! I'd like to order:`,
    ``,
    ...items.map((i) => {
      const variant = [i.size && `Size ${i.size}`, i.color].filter(Boolean).join(", ");
      return `• ${i.name}${variant ? ` (${variant})` : ""} × ${i.quantity} — ${STORE.currency}${(
        i.price * i.quantity
      ).toFixed(2)}`;
    }),
    ``,
    `Total: ${STORE.currency}${subtotal.toFixed(2)}`,
    ``,
    `Name: `,
    `Delivery address: `,
  ];
  return lines.join("\n");
}

export function whatsappOrderLink(items, subtotal) {
  const message = buildOrderMessage(items, subtotal);
  return `https://wa.me/${STORE.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
