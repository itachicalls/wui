const SERIES_MAP = {
  global_simple: 'WUIGLOBALSMPAVG',
  global_gdp: 'WUIGLOBALGDPWTAVG',
  advanced: 'WUIADVECON',
  emerging: 'WUIEMERGECON',
  europe: 'WUIEUROPE',
  asia_pacific: 'WUIASIAPACIFIC',
  africa: 'WUIAFRICA',
  middle_east: 'WUIMIDDLEEASTCENTRALASIA',
  latin_america: 'WUILATAMCARIBBEAN',
  us: 'WUIUSA',
  china: 'WUICHN',
  uk: 'WUIGBR',
  germany: 'WUIDEU',
  japan: 'WUIJPN',
  india: 'WUIIND',
  brazil: 'WUIBRA',
  france: 'WUIFRA',
  canada: 'WUICAN',
  australia: 'WUIAUS',
  russia: 'WUIRUS',
  south_korea: 'WUIKOR',
  mexico: 'WUIMEX',
  italy: 'WUIITA',
  spain: 'WUIESP',
  saudi_arabia: 'WUISAU',
  turkey: 'WUITUR',
  south_africa: 'WUIZAF',
  nigeria: 'WUINGA',
  egypt: 'WUIEGY',
  argentina: 'WUIARG',
  epu_us_monthly: 'USEPUINDXM',
  epu_us_daily: 'USEPUINDXD',
  epu_global: 'GEPUCURRENT',
  emv_daily: 'WLEMUINDXD',
};

function parseCSV(csv) {
  const lines = csv.trim().split('\n');
  const observations = [];
  for (let i = 1; i < lines.length; i++) {
    const [date, value] = lines[i].split(',');
    if (!date || !value || value === '.') continue;
    const num = parseFloat(value);
    if (!isNaN(num)) observations.push({ date: date.trim(), value: num });
  }
  return observations;
}

async function fetchFromFRED(seriesId) {
  const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'WUI-Tracker/1.0',
      'Accept': 'text/csv',
    },
  });

  if (!res.ok) {
    throw new Error(`FRED returned ${res.status} for ${seriesId}`);
  }

  const csv = await res.text();
  const observations = parseCSV(csv);

  if (observations.length === 0) {
    throw new Error(`No data returned for ${seriesId}`);
  }

  return observations;
}

module.exports = { SERIES_MAP, fetchFromFRED };
