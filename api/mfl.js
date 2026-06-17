const norm = s => (s || "").toLowerCase().replace(/[^a-z]/g, "");

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { server, year = "2026", TYPE, L, names, POSITIONS, ...rest } = req.query;

  if (!server || !TYPE) {
    return res.status(400).json({ error: "Missing required params: server, TYPE" });
  }

  // playersByName: fetch position-filtered player lists (small requests), return only matches.
  // Avoids the massive full player DB which hangs and kills the connection.
  if (TYPE === "playersByName") {
    const nameSet = new Set((names || "").split(",").filter(Boolean));
    if (!nameSet.size) return res.status(400).json({ error: "Missing names param" });

    const positions = (POSITIONS || "QB,RB,WR,TE").split(",");
    const matched = [];
    const errors = [];

    for (const pos of positions) {
      const urls = [
        `https://${server}.myfantasyleague.com/${year}/export?TYPE=players&POSITION=${pos}&JSON=1${L ? `&L=${L}` : ""}`,
        `https://api.myfantasyleague.com/${year}/export?TYPE=players&POSITION=${pos}&JSON=1${L ? `&L=${L}` : ""}`,
      ];
      let gotPos = false;
      for (const url of urls) {
        try {
          const r = await fetch(url, {
            headers: { "Accept-Encoding": "gzip, deflate, br" },
            signal: AbortSignal.timeout(20000),
          });
          if (!r.ok) { errors.push(`${pos}: HTTP ${r.status}`); continue; }
          const data = await r.json();
          const all = data?.players?.player ?? [];
          const arr = Array.isArray(all) ? all : [all];
          const hits = arr.filter(p => nameSet.has(norm(p.name)));
          matched.push(...hits);
          gotPos = true;
          break;
        } catch (e) {
          errors.push(`${pos}: ${e.message}`);
        }
      }
      if (!gotPos) errors.push(`${pos}: all urls failed`);
    }

    res.setHeader("Cache-Control", "no-store");
    return res.json({ players: { player: matched }, _meta: { matched: matched.length, errors } });
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
