import { inventorySupabase, hasInventoryLink } from "./inventoryClient";

// Looks up the live inventory item for a product by matching Moderna's
// product name directly against the Stockroom inventory system's "name"
// field (both sides must match exactly). Returns null when there's no link
// configured or no matching inventory item — callers should fall back to
// the manual in_stock toggle in that case.
export async function fetchInventoryItem(name) {
  if (!hasInventoryLink || !name) return null;

  const { data, error } = await inventorySupabase
    .from("inventory")
    .select("quantity, variants")
    .eq("name", name);

  if (error || !data || data.length === 0) return null;

  // Combine every matching row's variants (normally just one row).
  const variants = data.flatMap((row) => row.variants || []);
  const quantity = data.reduce((sum, row) => sum + (row.quantity || 0), 0);
  return { quantity, variants };
}

function sumShopQtys(shopQtys) {
  return Object.values(shopQtys || {}).reduce((sum, q) => sum + (q || 0), 0);
}

// Stock for one specific size + color combination. Color is optional — if
// the product has no color options, pass null/undefined and it matches on
// size alone (summing across whatever colors that size has).
export function stockForVariant(item, size, color) {
  if (!item?.variants?.length) return 0;
  return item.variants
    .filter(
      (v) =>
        String(v.size) === String(size) &&
        (!color || String(v.color).toLowerCase() === String(color).toLowerCase())
    )
    .reduce((sum, v) => sum + sumShopQtys(v.shopQtys), 0);
}

// Total stock for a size across all its colors — used to grey out a size
// button before a color has been picked.
export function stockForSize(item, size) {
  return stockForVariant(item, size, null);
}
