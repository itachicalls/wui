const { SERIES_MAP } = require('./_shared');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');
  res.json(Object.entries(SERIES_MAP).map(([key, id]) => ({ key, id })));
};
