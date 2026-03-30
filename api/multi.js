const API_KEY = process.env.FRED_API_KEY || '';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=3600');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const keys = (req.query.series || '').split(',').filter(Boolean);
  if (!keys.length) return res.status(400).json({ error: 'Provide ?series=id1,id2' });
  if (!API_KEY) return res.status(500).json({ error: 'FRED_API_KEY not configured' });

  const results = {};
  await Promise.all(keys.map(async (sid) => {
    try {
      const r = await fetch(`https://api.stlouisfed.org/fred/series/observations?series_id=${sid}&file_type=json&api_key=${API_KEY}`);
      if (!r.ok) return;
      const json = await r.json();
      const obs = (json.observations || [])
        .filter(o => o.value && o.value !== '.')
        .map(o => ({ date: o.date, value: parseFloat(o.value) }))
        .filter(o => !isNaN(o.value));
      if (obs.length) results[sid] = obs;
    } catch (_) {}
  }));
  res.json(results);
};
