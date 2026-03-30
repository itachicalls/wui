const { SERIES_MAP, fetchFromFRED } = require('./_shared');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=21600, stale-while-revalidate=3600');

  const keys = (req.query.series || '').split(',').filter(Boolean);
  if (!keys.length) {
    return res.status(400).json({ error: 'Provide ?series=key1,key2' });
  }

  const results = {};
  const errors = [];

  await Promise.all(
    keys.map(async (key) => {
      const seriesId = SERIES_MAP[key];
      if (!seriesId) return;
      try {
        results[key] = await fetchFromFRED(seriesId);
      } catch (err) {
        errors.push({ key, error: err.message });
      }
    })
  );

  res.json(results);
};
