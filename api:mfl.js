export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { server, year = "2026", TYPE, L, ...rest } = req.query;

  if (!server || !TYPE) {
    return res.status(400).json({ error: "Missing required params: server, TYPE" });
  }

  const params = new URLSearchParams({ TYPE, JSON: "1" });
  if (L) params.set("L", L);
  Object.entries(rest).forEach(([k, v]) => params.set(k, v));

  const url = `https://${server}.myfantasyleague.com/${year}/export?${params}`;

  try {
    const r = await fetch(url);
    if (!r.ok) return res.status(r.status).json({ error: `MFL returned ${r.status}` });
    const data = await r.json();
    res.setHeader("Cache-Control", "no-store");
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
