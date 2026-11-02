import { createClient } from "@supabase/supabase-js";
import { cancelAndRestock } from "./_cancelOrder.js";

const NOT_SIGNED_IN = { ok: false, reason: "auth", detail: "Please sign in again." };

function authClient(url, anonKey, token) {
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ ok: false, reason: "method" });

  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const orderId = req.body?.orderId;
  if (!token) return res.status(401).json(NOT_SIGNED_IN);
  if (!orderId || !["string", "number"].includes(typeof orderId)) {
    return res.status(400).json({ ok: false, reason: "error", detail: "Missing order." });
  }

  const url = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return res.status(500).json({ ok: false, reason: "error", detail: "Server isn't set up." });
  }

  // The caller's own login decides what they may do: customers can't read or
  // change orders, only the signed-in admin can.
  const db = authClient(url, anonKey, token);
  const { data: auth } = await db.auth.getUser(token);
  if (!auth?.user) return res.status(401).json(NOT_SIGNED_IN);

  const inventoryUrl = process.env.VITE_INVENTORY_SUPABASE_URL;
  const inventoryKey = process.env.VITE_INVENTORY_SUPABASE_ANON_KEY;
  const secret = process.env.RESTOCK_SECRET;
  const linked = Boolean(inventoryUrl && inventoryKey);
  if (linked && !secret) {
    return res.status(500).json({ ok: false, reason: "error", detail: "Server isn't set up." });
  }

  const deps = {
    orders: {
      find: (id) =>
        db.from("orders").select("id, status, reference").eq("id", id).maybeSingle(),
      setStatus: (id, from, to) =>
        db.from("orders").update({ status: to }).eq("id", id).eq("status", from).select("id").maybeSingle(),
    },
    restock: async (reference) => {
      if (!linked || !reference) return { ok: true, restored: 0 };
      const stockroom = createClient(inventoryUrl, inventoryKey, { auth: { persistSession: false } });
      const { data, error } = await stockroom.rpc("restock_order", {
        p_reference: reference,
        p_secret: secret,
      });
      if (error) return { ok: false, detail: error.message };
      return { ok: true, restored: Number(data) || 0 };
    },
  };

  try {
    const { status, body } = await cancelAndRestock({ orderId }, deps);
    return res.status(status).json(body);
  } catch (err) {
    return res.status(500).json({ ok: false, reason: "error", detail: err.message });
  }
}
