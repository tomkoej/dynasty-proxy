const norm = s => (s || "").toLowerCase().replace(/[^a-z]/g, "");

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { server, year = "2026", TYPE, L, names, POSITIONS, ...rest } = req.query;

  if (!server || !TYPE) {
    return res.status(400).json({ error: "Missing required params: server, TYPE" });
  }

  // playersByName: fetch MFL player DB server-side, return only watchlist matches
  if (TYPE === "playersByName") {
    const nameSet = new Set((names || "").split(",").filter(Boolean));
    if (!nameSet.size) return res.status(400).json({ error: "Missing names param" });

    const bases = [
      `https://${server}.myfantasyleague.com`,
      `https://api.myfantasyleague.com`,
      `https://www.myfantasyleague.com`,
    ];
    const errors = [];

    for (const base of bases) {
      const urls = L
        ? [`${base}/${year}/export?TYPE=players&L=${L}&JSON=1`, `${base}/${year}/export?TYPE=players&JSON=1`]
        : [`${base}/${year}/export?TYPE=players&JSON=1`];

      for (const url of urls) {
        try {
          const r = await fetch(url, {
            headers: { "Accept-Encoding": "gzip, deflate, br" },
          });
          if (!r.ok) { errors.push(`${url} → HTTP ${r.status}`); continue; }
          const data = await r.json();
          const all = data?.players?.player ?? [];
          const arr = Array.isArray(all) ? all : [all];
          if (arr.length === 0) { errors.push(`${url} → empty`); continue; }
          const filtered = arr.filter(p => nameSet.has(norm(p.name)));
          res.setHeader("Cache-Control", "no-store");
          return res.json({ players: { player: filtered }, _meta: { total: arr.length, matched: filtered.length } });
        } catch (e) {
          errors.push(`${url} → ${e.message}`);
        }
      }
    }
    return res.status(500).json({ error: "Player DB unavailable", attempts: errors });
  }

  const headers = {
    "User-Agent": "Mozilla/5.0 (compatible; MFL-Watchlist/1.0)",
    "Accept": "application/json, text/plain, */*",
    "Accept-Encoding": "gzip, deflate, br",
  };

  // Tradebait must use api.myfantasyleague.com — try several URL forms
  if (TYPE === "tradebait") {
    const tbUrls = [
      `https://api.myfantasyleague.com/${year}/export?TYPE=tradebait&L=${L}&JSON=1`,
      `https://www.myfantasyleague.com/${year}/export?TYPE=tradebait&L=${L}&JSON=1`,
      `https://${server}.myfantasyleague.com/${year}/export?TYPE=tradebait&L=${L}&JSON=1`,
    ];
    const attempts = [];
    for (const url of tbUrls) {
      try {
        const r = await fetch(url, { headers });
        const data = await r.json();
        if (!data?.error) {
          res.setHeader("Cache-Control", "no-store");
          return res.json(data);
        }
        attempts.push(`${url} → ${JSON.stringify(data.error).slice(0, 80)}`);
      } catch (e) {
        attempts.push(`${url} → ${e.message}`);
      }
    }
    // All failed — return diagnostic info
    res.setHeader("Cache-Control", "no-store");
    return res.json({ tradeBaits: "", _debug: attempts });
  }

  // Standard proxy for all other MFL API calls
  try {
    const params = new URLSearchParams({ TYPE, JSON: "1" });
    if (L) params.set("L", L);
    Object.entries(rest).forEach(([k, v]) => params.set(k, v));
    const url = `https://${server}.myfantasyleague.com/${year}/export?${params}`;

    const r = await fetch(url, { headers });
    if (!r.ok) return res.status(r.status).json({ error: `MFL returned ${r.status}` });
    const data = await r.json();
    res.setHeader("Cache-Control", "no-store");
    return res.json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
