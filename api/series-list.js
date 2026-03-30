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

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');
  res.json(Object.entries(SERIES_MAP).map(([key, id]) => ({ key, id })));
};
