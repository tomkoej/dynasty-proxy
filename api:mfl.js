const norm = s => (s || "").toLowerCase().replace(/[^a-z]/g, "");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { server, year = "2026", TYPE, L, names, ...rest } = req.query;

  if (!server || !TYPE) {
    return res.status(400).json({ error: "Missing required params: server, TYPE" });
  }

  // playersByName: fetch the full MFL player DB server-side, return only matches.
  // This keeps the response tiny regardless of how large the full DB is.
  if (TYPE === "playersByName") {
    const nameSet = new Set((names || "").split(",").filter(Boolean));
    if (!nameSet.size) return res.status(400).json({ error: "Missing names param" });

    const url = `https://${server}.myfantasyleague.com/${year}/export?TYPE=players&JSON=1`;
    try {
      const r = await fetch(url);
      if (!r.ok) return res.status(r.status).json({ error: `MFL returned ${r.status}` });
      const data = await r.json();
      const all = data?.players?.player ?? [];
      const arr = Array.isArray(all) ? all : [all];
      const filtered = arr.filter(p => nameSet.has(norm(p.name)));
      res.setHeader("Cache-Control", "no-store");
      return res.json({ players: { player: filtered } });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Standard proxy for all other MFL API calls
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
