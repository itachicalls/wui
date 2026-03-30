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

async function fetchFRED(seriesId) {
  const r = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`, {
    headers: { 'User-Agent': 'WUI-Tracker/1.0', Accept: 'text/csv' },
  });
  if (!r.ok) throw new Error(`FRED ${r.status}`);
  const obs = parseCSV(await r.text());
  if (!obs.length) throw new Error('No data');
  return obs;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=3600');

  const keys = (req.query.series || '').split(',').filter(Boolean);
  if (!keys.length) return res.status(400).json({ error: 'Provide ?series=key1,key2' });

  const results = {};
  await Promise.all(
    keys.map(async (key) => {
      const seriesId = SERIES_MAP[key];
      if (!seriesId) return;
      try { results[key] = await fetchFRED(seriesId); } catch (_) {}
    })
  );
  res.json(results);
};
