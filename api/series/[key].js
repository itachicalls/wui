const { SERIES_MAP, fetchFromFRED } = require('../_shared');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=3600');

  const { key } = req.query;
  const seriesId = SERIES_MAP[key];

  if (!seriesId) {
    return res.status(400).json({ error: `Unknown series: ${key}` });
  }

  try {
    const observations = await fetchFromFRED(seriesId);
    res.json({ series: key, id: seriesId, count: observations.length, observations });
  } catch (err) {
    res.status(502).json({ error: 'Failed to fetch data', detail: err.message });
  }
};
