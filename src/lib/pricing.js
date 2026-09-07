// Shared discount math so the shop grid, product page, and cart all agree
// on what a customer actually pays.
export function discountedPrice(product) {
  const price = Number(product?.price) || 0;
  const pct = Number(product?.discount_percent) || 0;
  if (pct <= 0) return price;
  return Math.round(price * (1 - pct / 100) * 100) / 100;
}

export function hasDiscount(product) {
  return Number(product?.discount_percent) > 0;
}
