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

// Takes stock in Stockroom for every item in an order, all or nothing: if any
// size/color is short, nothing is taken and { ok: false, reason: "insufficient" }
// comes back with a readable `detail` (e.g. "1626 (size 36)").
export async function takeStock(items, reference) {
  if (!hasInventoryLink) return { ok: true };

  // The reference lets Stockroom remember exactly what this order took, so a
  // cancelled order can put the same pairs back.
  const payload = items.map((i) => ({
    name: i.name,
    size: i.size ?? "",
    color: i.color ?? "",
    quantity: i.quantity,
    reference,
  }));

  const { error } = await inventorySupabase.rpc("take_stock", { p_items: payload });
  if (!error) return { ok: true };

  if (/insufficient stock/i.test(error.message || "")) {
    return {
      ok: false,
      reason: "insufficient",
      detail: error.message.replace(/^.*insufficient stock:\s*/i, ""),
    };
  }
  return { ok: false, reason: "error", detail: error.message };
}

// Puts back exactly what an order took, once (a second call restores nothing).
// Returns { ok: true, restored } or { ok: false, detail }.
export async function restockOrder(reference) {
  if (!hasInventoryLink || !reference) return { ok: true, restored: 0 };

  const { data, error } = await inventorySupabase.rpc("restock_order", { p_reference: reference });
  if (error) return { ok: false, detail: error.message };
  return { ok: true, restored: Number(data) || 0 };
}

// One request for the admin product list: product name -> total quantity in
// Stockroom. Names that aren't in Stockroom are simply absent from the result.
export async function fetchStockTotals(names) {
  if (!hasInventoryLink || !names?.length) return {};

  const { data, error } = await inventorySupabase
    .from("inventory")
    .select("name, quantity")
    .in("name", names);
  if (error || !data) return {};

  const totals = {};
  for (const row of data) totals[row.name] = (totals[row.name] || 0) + (row.quantity || 0);
  return totals;
}

// The distinct sizes and colors Stockroom has for this item, so the admin
// form can fill those in automatically instead of typing them by hand.
export function sizesAndColorsFromItem(item) {
  if (!item?.variants?.length) return { sizes: [], colors: [] };

  const sizes = [...new Set(item.variants.map((v) => v.size).filter(Boolean))];
  const colors = [...new Set(item.variants.map((v) => v.color).filter(Boolean))];

  sizes.sort((a, b) => {
    const na = Number(a);
    const nb = Number(b);
    return !isNaN(na) && !isNaN(nb) ? na - nb : String(a).localeCompare(String(b));
  });

  return { sizes, colors };
}
