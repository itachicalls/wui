const express = require('express');
const http = require('http');
const path = require('path');
const { WebSocketServer } = require('ws');
const engine = require('./engine');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(express.json());

const cache = new Map();
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

const SERIES_MAP = {
  // WUI Core
  global_simple: 'WUIGLOBALSMPAVG',
  global_gdp: 'WUIGLOBALGDPWTAVG',
  advanced: 'WUIADVECON',
  emerging: 'WUIEMERGE',
  europe: 'WUIEUROPE',
  asia_pacific: 'WUIASIAPACIFIC',
  africa: 'WUIAFRICA',
  middle_east: 'WUIMIDEAST',
  latin_america: 'WUIWEST',
  // WUI Countries
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
  // Supplementary FRED indices (updated daily/monthly — extends into 2026)
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
  const cached = cache.get(seriesId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  let observations = [];

  const apiKey = process.env.FRED_API_KEY;
  if (apiKey) {
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${seriesId}&file_type=json&api_key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`FRED API returned ${res.status} for ${seriesId}`);
    const json = await res.json();
    observations = (json.observations || [])
      .filter(o => o.value && o.value !== '.')
      .map(o => ({ date: o.date, value: parseFloat(o.value) }))
      .filter(o => !isNaN(o.value));
  } else {
    const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${seriesId}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'WUI-Tracker/1.0', Accept: 'text/csv' },
    });
    if (!res.ok) throw new Error(`FRED returned ${res.status} for ${seriesId}`);
    observations = parseCSV(await res.text());
  }

  if (observations.length === 0) {
    throw new Error(`No data returned for ${seriesId}`);
  }

  cache.set(seriesId, { data: observations, ts: Date.now() });
  return observations;
}

app.use(express.static(path.join(__dirname, 'public')));

const REVERSE_MAP = Object.fromEntries(Object.entries(SERIES_MAP).map(([k, v]) => [v, k]));

// Frontend-compatible route (matches Vercel /api/data)
app.get('/api/data', async (req, res) => {
  try {
    const key = req.query.key;
    if (!key) return res.status(400).json({ error: 'Provide ?key=SERIES_ID' });
    const seriesId = SERIES_MAP[key] || key;
    const observations = await fetchFromFRED(seriesId);
    res.json({ observations });
  } catch (err) {
    console.error(`Error fetching ${req.query.key}:`, err.message);
    res.status(502).json({ error: err.message });
  }
});

app.get('/api/series/:key', async (req, res) => {
  try {
    const seriesId = SERIES_MAP[req.params.key];
    if (!seriesId) {
      return res.status(400).json({ error: `Unknown series: ${req.params.key}` });
    }
    const observations = await fetchFromFRED(seriesId);
    res.json({
      series: req.params.key,
      id: seriesId,
      count: observations.length,
      observations,
    });
  } catch (err) {
    console.error(`Error fetching ${req.params.key}:`, err.message);
    res.status(502).json({ error: 'Failed to fetch data', detail: err.message });
  }
});

app.get('/api/multi', async (req, res) => {
  try {
    const keys = (req.query.series || '').split(',').filter(Boolean);
    if (!keys.length) return res.status(400).json({ error: 'Provide ?series=key1,key2' });

    const results = {};
    const errors = [];

    await Promise.all(
      keys.map(async (key) => {
        const seriesId = SERIES_MAP[key] || key;
        try {
          results[key] = await fetchFromFRED(seriesId);
        } catch (err) {
          errors.push({ key, error: err.message });
          console.error(`Error fetching ${key}:`, err.message);
        }
      })
    );

    res.json(results);
    if (errors.length) console.warn('Partial errors:', errors);
  } catch (err) {
    console.error('Multi-fetch error:', err.message);
    res.status(502).json({ error: 'Failed to fetch data', detail: err.message });
  }
});

app.get('/api/series-list', (_req, res) => {
  res.json(Object.entries(SERIES_MAP).map(([key, id]) => ({ key, id })));
});

// ═══ WUI Intelligence API ═══

app.get('/wui/live', (_req, res) => {
  const s = engine.state;
  if (!s.live_wui) return res.json({ status: 'initializing', message: 'Engine has not completed first cycle yet.' });
  res.json(s.live_wui);
});

app.get('/wui/history', async (req, res) => {
  try {
    const obs = await fetchFromFRED('WUIGLOBALSMPAVG');
    res.json({ series: 'WUIGLOBALSMPAVG', count: obs.length, observations: obs });
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

app.get('/correlations', (_req, res) => {
  res.json(engine.state.correlations || []);
});

app.get('/countries', (_req, res) => {
  res.json(engine.state.countries || []);
});

app.get('/alerts', (_req, res) => {
  res.json(engine.state.alerts || []);
});

app.get('/news', (_req, res) => {
  res.json(engine.state.headlines || []);
});

app.get('/trade-signals', (_req, res) => {
  res.json(engine.state.trade_signals || []);
});

app.get('/output', (_req, res) => {
  res.json(engine.getFullOutput());
});

app.post('/scenario', (req, res) => {
  const { scenario } = req.body || {};
  if (!scenario) return res.status(400).json({ error: 'Provide { "scenario": "oil_120" }' });
  const result = engine.simulate(scenario);
  if (!result) return res.status(404).json({ error: `Unknown scenario: ${scenario}` });
  res.json(result);
});

// ═══ WebSocket ═══

const wss = new WebSocketServer({ server, path: '/live-stream' });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'connected', data: engine.getFullOutput() }));
});

function broadcast(data) {
  const msg = JSON.stringify({ type: 'wui_update', data, timestamp: new Date().toISOString() });
  wss.clients.forEach(client => {
    if (client.readyState === 1) client.send(msg);
  });
}

// ═══ Engine Cycle (every 5 minutes) ═══

const ENGINE_INTERVAL = 5 * 60 * 1000;

async function runEngineCycle() {
  try {
    const result = await engine.run(fetchFromFRED);
    if (result) broadcast(result);
  } catch (err) {
    console.error('  [Engine] Cycle error:', err.message);
  }
}

server.listen(PORT, () => {
  console.log(`\n  World Uncertainty Index — Intelligence Terminal`);
  console.log(`  ──────────────────────────────────────────────`);
  console.log(`  Dashboard:    http://localhost:${PORT}`);
  console.log(`  WebSocket:    ws://localhost:${PORT}/live-stream`);
  console.log(`  API:          http://localhost:${PORT}/wui/live`);
  console.log(`  Full Output:  http://localhost:${PORT}/output`);
  console.log(`  Data source:  FRED (Federal Reserve Economic Data)`);
  console.log(`  Engine cycle: every 5 minutes`);
  console.log(`  Cache TTL:    6 hours\n`);

  setTimeout(runEngineCycle, 3000);
  setInterval(runEngineCycle, ENGINE_INTERVAL);
});
