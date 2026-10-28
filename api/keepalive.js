// Called once a day by Vercel Cron (see vercel.json). Free Supabase projects
// pause after about a week without traffic; one tiny read a day keeps both
// databases awake. It only reports HTTP status codes — no data, no secrets.
const TARGETS = [
  {
    name: "moderna",
    url: "VITE_SUPABASE_URL",
    key: "VITE_SUPABASE_ANON_KEY",
    path: "/rest/v1/products?select=id&limit=1",
  },
  {
    name: "stockroom",
    url: "VITE_INVENTORY_SUPABASE_URL",
    key: "VITE_INVENTORY_SUPABASE_ANON_KEY",
    path: "/rest/v1/inventory?select=id&limit=1",
  },
];

async function ping(target) {
  const base = process.env[target.url];
  const key = process.env[target.key];
  if (!base || !key) return "not configured";
  try {
    const response = await fetch(base + target.path, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15000),
    });
    return response.status;
  } catch (err) {
    return `error: ${err.name}`;
  }
}

export default async function handler(req, res) {
  const statuses = await Promise.all(TARGETS.map(ping));
  const results = Object.fromEntries(TARGETS.map((t, i) => [t.name, statuses[i]]));

  // Cached for an hour so repeated hits can't spam the databases.
  res.setHeader("Cache-Control", "public, s-maxage=3600");
  res.status(200).json({ ok: true, results });
}
