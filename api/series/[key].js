const SERIES_MAP = {
  global_simple: 'WUIGLOBALSMPAVG', global_gdp: 'WUIGLOBALGDPWTAVG',
  advanced: 'WUIADVECON', emerging: 'WUIEMERGECON',
  europe: 'WUIEUROPE', asia_pacific: 'WUIASIAPACIFIC',
  africa: 'WUIAFRICA', middle_east: 'WUIMIDDLEEASTCENTRALASIA',
  latin_america: 'WUILATAMCARIBBEAN',
  us: 'WUIUSA', china: 'WUICHN', uk: 'WUIGBR', germany: 'WUIDEU',
  japan: 'WUIJPN', india: 'WUIIND', brazil: 'WUIBRA', france: 'WUIFRA',
  canada: 'WUICAN', australia: 'WUIAUS', russia: 'WUIRUS',
  south_korea: 'WUIKOR', mexico: 'WUIMEX', italy: 'WUIITA', spain: 'WUIESP',
  saudi_arabia: 'WUISAU', turkey: 'WUITUR', south_africa: 'WUIZAF',
  nigeria: 'WUINGA', egypt: 'WUIEGY', argentina: 'WUIARG',
  epu_us_monthly: 'USEPUINDXM', epu_us_daily: 'USEPUINDXD',
  epu_global: 'GEPUCURRENT', emv_daily: 'WLEMUINDXD',
};

function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const obs = [];
  for (let i = 1; i < lines.length; i++) {
    const [date, value] = lines[i].split(',');
    if (!date || !value || value === '.') continue;
    const num = parseFloat(value);
    if (!isNaN(num)) obs.push({ date: date.trim(), value: num });
  }
  return obs;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=3600');

  const { key } = req.query;
  const seriesId = SERIES_MAP[key];
  if (!seriesId) return res.status(400).json({ error: `Unknown series: ${key}` });

  try {
    const r = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`, {
      headers: { 'User-Agent': 'WUI-Tracker/1.0', Accept: 'text/csv' },
    });
    if (!r.ok) throw new Error(`FRED ${r.status}`);
    const observations = parseCSV(await r.text());
    if (!observations.length) throw new Error('No data');
    res.json({ series: key, id: seriesId, count: observations.length, observations });
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch data', detail: err.message });
  }
};
