module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=3600');

  const seriesId = req.query.key;
  if (!seriesId) return res.status(400).json({ error: 'Provide ?key=SERIES_ID' });

  try {
    const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`;
    const r = await fetch(url, {
      headers: { 'User-Agent': 'WUI-Tracker/1.0', Accept: 'text/csv' },
    });
    if (!r.ok) throw new Error(`FRED returned ${r.status}`);
    const csv = await r.text();
    const lines = csv.trim().split('\n');
    const observations = [];
    for (let i = 1; i < lines.length; i++) {
      const [date, value] = lines[i].split(',');
      if (!date || !value || value === '.') continue;
      const num = parseFloat(value);
      if (!isNaN(num)) observations.push({ date: date.trim(), value: num });
    }
    if (!observations.length) throw new Error('No data returned');
    res.json({ observations });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
};
