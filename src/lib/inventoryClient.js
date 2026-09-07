import { createClient } from "@supabase/supabase-js";

// Separate Supabase project — the Stockroom inventory system, not Moderna's own database.
const inventoryUrl = import.meta.env.VITE_INVENTORY_SUPABASE_URL;
const inventoryAnonKey = import.meta.env.VITE_INVENTORY_SUPABASE_ANON_KEY;

export const hasInventoryLink = Boolean(inventoryUrl && inventoryAnonKey);

export const inventorySupabase = hasInventoryLink
  ? createClient(inventoryUrl, inventoryAnonKey)
  : null;
