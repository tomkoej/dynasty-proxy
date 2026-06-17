const norm = s => (s || "").toLowerCase().replace(/[^a-z]/g, "");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { server, year = "2026", TYPE, L, names, ...rest } = req.query;

  if (!server || !TYPE) {
    return res.status(400).json({ error: "Missing required params: server, TYPE" });
  }

  // playersByName: fetch MFL player DB server-side (no timeout — let Vercel's 60s limit handle it),
  // then return only the players that match the watchlist.
  if (TYPE === "playersByName") {
    const nameSet = new Set((names || "").split(",").filter(Boolean));
    if (!nameSet.size) return res.status(400).json({ error: "Missing names param" });

    const errors = [];

    // Try several base URLs — the players DB may live on a different host than league data
    const bases = [
      `https://api.myfantasyleague.com`,
      `https://${server}.myfantasyleague.com`,
      `https://www.myfantasyleague.com`,
    ];

    for (const base of bases) {
      const urls = L
        ? [`${base}/${year}/export?TYPE=players&L=${L}&JSON=1`, `${base}/${year}/export?TYPE=players&JSON=1`]
        : [`${base}/${year}/export?TYPE=players&JSON=1`];

      for (const url of urls) {
        try {
          // No AbortSignal here — let the 60-second Vercel limit be the ceiling
          const r = await fetch(url, {
            headers: { "Accept-Encoding": "gzip, deflate, br" },
          });
          if (!r.ok) { errors.push(`${url} → HTTP ${r.status}`); continue; }
          const data = await r.json();
          const all = data?.players?.player ?? [];
          const arr = Array.isArray(all) ? all : [all];
          if (arr.length === 0) { errors.push(`${url} → empty list`); continue; }
          const filtered = arr.filter(p => nameSet.has(norm(p.name)));
          res.setHeader("Cache-Control", "no-store");
          return res.json({
            players: { player: filtered },
            _meta: { total: arr.length, matched: filtered.length, source: url },
          });
        } catch (e) {
          errors.push(`${url} → ${e.message}`);
        }
      }
    }

    return res.status(500).json({ error: "All player DB attempts failed", attempts: errors });
  }

  // Standard proxy for all other MFL API calls
  const params = new URLSearchParams({ TYPE, JSON: "1" });
  if (L) params.set("L", L);
  Object.entries(rest).forEach(([k, v]) => params.set(k, v));
  const url = `https://${server}.myfantasyleague.com/${year}/export?${params}`;

  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) return res.status(r.status).json({ error: `MFL returned ${r.status}` });
    const data = await r.json();
    res.setHeader("Cache-Control", "no-store");
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
