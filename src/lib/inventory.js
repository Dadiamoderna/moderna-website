import { inventorySupabase, hasInventoryLink } from "./inventoryClient";

// Looks up live stock for a product by matching Moderna's product name
// directly against the Stockroom inventory system's "name" field (which is
// where codes like "MG1527" are entered there too — both sides must match
// exactly). Returns null when there's no link configured or no matching
// inventory item — callers should fall back to the manual in_stock toggle.
export async function fetchStockByCode(name) {
  if (!hasInventoryLink || !name) return null;

  const { data, error } = await inventorySupabase
    .from("inventory")
    .select("quantity")
    .eq("name", name);

  if (error || !data || data.length === 0) return null;

  return data.reduce((sum, row) => sum + (row.quantity || 0), 0);
}
