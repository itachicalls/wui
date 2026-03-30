const API_KEY = process.env.FRED_API_KEY || '';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=3600');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const seriesId = req.query.key;
  if (!seriesId) return res.status(400).json({ error: 'Provide ?key=SERIES_ID' });
  if (!API_KEY) return res.status(500).json({ error: 'FRED_API_KEY not configured' });

  try {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&file_type=json&api_key=${API_KEY}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`FRED API ${r.status}`);
    const json = await r.json();

    const observations = (json.observations || [])
      .filter(o => o.value && o.value !== '.')
      .map(o => ({ date: o.date, value: parseFloat(o.value) }))
      .filter(o => !isNaN(o.value));

    if (!observations.length) throw new Error('No data returned');
    res.json({ observations });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
};
