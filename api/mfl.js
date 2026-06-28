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

  // MFL login — docs require POST + XML=1; login response is XML, not JSON
  if (TYPE === "login") {
    const { USERNAME, PASSWORD } = req.query;
    if (!USERNAME || !PASSWORD) return res.status(400).json({ error: "Missing USERNAME or PASSWORD" });
    try {
      const url = `https://api.myfantasyleague.com/${year}/login`;
      const body = new URLSearchParams({ USERNAME, PASSWORD, XML: "1" });
      const r = await fetch(url, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
      const rawText = await r.text();
      res.setHeader("Cache-Control", "no-store");

      // XML response: <status cookie_name="MFL_USER_ID" cookie_value="abc123..." status="OK" />
      const cookieMatch = rawText.match(/cookie_value="([^"]+)"/);
      if (cookieMatch) {
        return res.json({ userInfo: { userinfo: cookieMatch[1] } });
      }

      // Surface any error message from XML
      const errMatch = rawText.match(/<error[^>]*>([^<]*)<\/error>/i)
        || rawText.match(/message="([^"]+)"/i);
      return res.json({
        error: errMatch ? errMatch[1] : "Login failed — check credentials",
        _debug: { httpStatus: r.status, body: rawText.slice(0, 300) },
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // tradeBait — TYPE is case-sensitive; auth via MFL_USER_ID cookie header
  if (TYPE === "tradeBait") {
    const tbParams = new URLSearchParams({ TYPE: "tradeBait", JSON: "1" });
    if (L) tbParams.set("L", L);
    const tbHeaders = { ...headers };
    if (rest.USERINFO) tbHeaders["Cookie"] = `MFL_USER_ID=${rest.USERINFO}`;
    const url = `https://api.myfantasyleague.com/${year}/export?${tbParams}`;
    try {
      const r = await fetch(url, { headers: tbHeaders });
      const data = await r.json();
      res.setHeader("Cache-Control", "no-store");
      return res.json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
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
