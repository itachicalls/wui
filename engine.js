/* ═══════════════════════════════════════════════════
   WUI Backend Intelligence Engine
   Headline scoring, live WUI, correlations,
   alerts, trading signals, narrative generation.
   Runs server-side on a 5-minute cycle.
   ═══════════════════════════════════════════════════ */

const KEYWORD_BOOSTS = {
  war: 3, conflict: 3, invasion: 3, military: 2, missile: 3, nuclear: 4,
  oil: 3, energy: 2, opec: 2, supply: 2, pipeline: 2, embargo: 3,
  fed: 2, rate: 2, central_bank: 2, ecb: 2, boj: 2, monetary: 2,
  crisis: 4, collapse: 4, crash: 3, default: 4, recession: 3, depression: 4,
  tariff: 3, sanction: 3, trade_war: 3, embargo: 3,
  election: 2, coup: 3, impeach: 2, resign: 2, protest: 2,
  pandemic: 4, virus: 3, lockdown: 3, outbreak: 3,
  inflation: 2, unemployment: 2, gdp: 1, debt: 2
};

const PRIORITY_WEIGHTS = { geopolitics: 1.0, energy: 0.9, central_banks: 0.8, inflation: 0.7, politics: 0.6, social: 0.5 };

const SCENARIOS = {
  oil_120:       { title: 'Oil Hits $120/barrel',       wui: '+15–25%', analog: '2022 Russia energy shock', eq: 'bearish', oil: 'bullish', crypto: 'mixed' },
  china_taiwan:  { title: 'China-Taiwan Escalation',    wui: '+30–50%', analog: '2020 COVID supply freeze', eq: 'severely bearish', oil: 'bullish', crypto: 'bullish' },
  fed_surprise:  { title: 'Fed Emergency Rate Cut',     wui: '+8–15%',  analog: 'March 2020 emergency cut', eq: 'mixed', oil: 'bearish', crypto: 'bullish' },
  recession:     { title: 'Global Recession Signal',    wui: '+20–35%', analog: '2008 GFC', eq: 'bearish', oil: 'bearish', crypto: 'bearish' },
  pandemic:      { title: 'Pandemic Resurgence',        wui: '+25–45%', analog: 'Q1 2020 COVID', eq: 'severely bearish', oil: 'bearish', crypto: 'mixed' },
  trade_war:     { title: 'Full Trade War Escalation',  wui: '+12–22%', analog: '2018-19 US-China + 2025 tariffs', eq: 'bearish', oil: 'mixed', crypto: 'mildly bullish' }
};

// ── State ──
const state = {
  live_wui: null,
  headlines: [],
  correlations: [],
  countries: [],
  alerts: [],
  trade_signals: [],
  insight: '',
  social_post: '',
  chart: [],
  last_update: null,
  cycle_count: 0
};

// ── Headline Scoring (Secret Sauce) ──
function scoreText(text) {
  const lower = text.toLowerCase();
  let boost = 0;
  for (const [kw, val] of Object.entries(KEYWORD_BOOSTS)) {
    if (lower.includes(kw.replace('_', ' ')) || lower.includes(kw)) boost += val;
  }
  return Math.min(10, boost);
}

function scoreHeadline(headline) {
  const textBoost = scoreText(headline.text);
  const severity = Math.min(10, (headline.severity || 5) + textBoost * 0.3);
  const impact = Math.min(10, (headline.impact || 5) + textBoost * 0.2);
  const scope = headline.scope || 5;
  const wui_signal = severity * 0.4 + impact * 0.4 + scope * 0.2;
  return { ...headline, severity: Math.round(severity * 10) / 10, impact: Math.round(impact * 10) / 10, scope, wui_signal: Math.round(wui_signal * 10) / 10 };
}

// ── Headline Generation (from real FRED data) ──
function generateHeadlines(data) {
  const raw = [];
  const { global, countries, rt } = data;

  if (global && global.length >= 2) {
    const last = global[global.length - 1], prev = global[global.length - 2];
    const chg = ((last.value - prev.value) / prev.value) * 100;
    raw.push({
      text: `Global Uncertainty Index ${chg > 0 ? 'rises' : 'falls'} to ${last.value.toFixed(1)} — ${chg > 0 ? 'risk aversion building across major economies' : 'risk appetite improving as geopolitical tensions ease'}`,
      category: 'macro', severity: 4 + Math.abs(chg) / 5, impact: 3 + Math.abs(chg) / 4, scope: 10,
      source: 'WUI Engine', timestamp: last.date
    });
  }

  if (rt.epu_us_daily && rt.epu_us_daily.length >= 10) {
    const d = rt.epu_us_daily, last5 = d.slice(-5), prev5 = d.slice(-10, -5);
    const a5 = last5.reduce((s, x) => s + x.value, 0) / 5;
    const p5 = prev5.reduce((s, x) => s + x.value, 0) / prev5.length;
    const chg = ((a5 - p5) / p5) * 100;
    raw.push({
      text: `US Economic Policy Uncertainty ${Math.abs(chg) > 10 ? (chg > 0 ? 'surges' : 'plunges') : (chg > 0 ? 'edges higher' : 'eases')} — 5-day average at ${a5.toFixed(0)}`,
      category: 'policy', severity: 3 + Math.abs(chg) / 4, impact: 4 + Math.abs(chg) / 5, scope: 7,
      source: 'FRED USEPUINDXD', timestamp: d[d.length - 1].date
    });
  }

  if (rt.emv_daily && rt.emv_daily.length >= 10) {
    const d = rt.emv_daily, last5 = d.slice(-5), prev5 = d.slice(-10, -5);
    const a5 = last5.reduce((s, x) => s + x.value, 0) / 5;
    const p5 = prev5.reduce((s, x) => s + x.value, 0) / prev5.length;
    const chg = ((a5 - p5) / p5) * 100;
    raw.push({
      text: `Equity Market Volatility ${chg > 0 ? 'spikes' : 'retreats'} — news-based tracker at ${a5.toFixed(0)}, ${chg > 0 ? 'signaling rising market stress' : 'suggesting calmer trading conditions'}`,
      category: 'markets', severity: 3 + Math.abs(chg) / 3, impact: 5 + Math.abs(chg) / 4, scope: 8,
      source: 'FRED WLEMUINDXD', timestamp: d[d.length - 1].date
    });
  }

  if (rt.epu_us_monthly && rt.epu_us_monthly.length >= 3) {
    const d = rt.epu_us_monthly, last = d[d.length - 1], prev = d[d.length - 2];
    const chg = ((last.value - prev.value) / prev.value) * 100;
    raw.push({
      text: `Monthly US policy uncertainty ${chg > 0 ? 'climbs' : 'declines'} to ${last.value.toFixed(0)} — ${chg > 0 ? 'structural concerns persisting' : 'indicating normalization trend'}`,
      category: 'policy', severity: 3 + Math.abs(chg) / 6, impact: 3 + Math.abs(chg) / 5, scope: 7,
      source: 'FRED USEPUINDXM', timestamp: last.date
    });
  }

  const countryKeys = ['us', 'china', 'uk', 'germany', 'japan', 'india', 'brazil', 'france', 'canada', 'russia'];
  const countryNames = { us: 'US', china: 'China', uk: 'UK', germany: 'Germany', japan: 'Japan', india: 'India', brazil: 'Brazil', france: 'France', canada: 'Canada', russia: 'Russia' };
  const movers = [];
  for (const k of countryKeys) {
    const d = countries[k];
    if (!d || d.length < 2) continue;
    const last = d[d.length - 1], prev = d[d.length - 2];
    const chg = ((last.value - prev.value) / prev.value) * 100;
    movers.push({ k, name: countryNames[k], chg, val: last.value, date: last.date });
  }
  movers.sort((a, b) => Math.abs(b.chg) - Math.abs(a.chg));
  for (const m of movers.slice(0, 3)) {
    raw.push({
      text: `${m.name} uncertainty ${m.chg > 0 ? 'jumps' : 'drops'} ${Math.abs(m.chg).toFixed(1)}% to ${m.val.toFixed(1)} — ${m.chg > 0 ? 'political and economic pressures mounting' : 'conditions stabilizing'}`,
      category: 'country', severity: 3 + Math.abs(m.chg) / 5, impact: 3 + Math.abs(m.chg) / 6, scope: 5,
      source: 'WUI Engine', timestamp: m.date
    });
  }

  return raw.map(h => scoreHeadline(h)).sort((a, b) => b.wui_signal - a.wui_signal);
}

// ── Live WUI Computation ──
function computeLiveWUI(data, headlines) {
  const g = data.global;
  if (!g || g.length < 2) return null;

  const baseline = g[g.length - 1];
  const prev = g[g.length - 2];
  const baseChange = ((baseline.value - prev.value) / prev.value) * 100;

  const avgSignal = headlines.length ? headlines.reduce((s, h) => s + h.wui_signal, 0) / headlines.length : 5;
  const zScore = (avgSignal - 5) / 2;
  const adjustment = Math.max(-0.075, Math.min(0.075, zScore * 0.03));
  const liveValue = baseline.value * (1 + adjustment);
  const liveChange = ((liveValue - prev.value) / prev.value) * 100;

  let momentum = 0;
  if (g.length >= 3) {
    const pp = g[g.length - 3];
    const prevChg = ((prev.value - pp.value) / pp.value) * 100;
    momentum = liveChange - prevChg;
  }

  const direction = liveChange > 3 ? 'rising' : liveChange < -3 ? 'falling' : 'stable';

  let agree = 0, total = 0;
  const epuD = data.rt.epu_us_daily || [], emvD = data.rt.emv_daily || [];
  if (epuD.length >= 20) {
    total++;
    const r = epuD.slice(-20);
    if (((r[r.length - 1].value - r[0].value) > 0) === (liveChange > 0)) agree++;
  }
  if (emvD.length >= 20) {
    total++;
    const r = emvD.slice(-20);
    if (((r[r.length - 1].value - r[0].value) > 0) === (liveChange > 0)) agree++;
  }
  const confidence = total === 0 ? 'medium' : agree === total ? 'high' : agree > 0 ? 'medium' : 'low';

  return {
    value: Math.round(liveValue * 100) / 100,
    change_percent: Math.round(liveChange * 100) / 100,
    direction,
    confidence,
    momentum: Math.round(momentum * 100) / 100,
    baseline_value: baseline.value,
    baseline_date: baseline.date,
    headline_adjustment: Math.round(adjustment * 10000) / 100,
    timestamp: new Date().toISOString()
  };
}

// ── Correlation Engine ──
function computeCorrelations(data) {
  const results = [];
  const g = data.global || [];

  function rollingCorr(a, b, window) {
    if (a.length < window || b.length < window) return null;
    const ax = a.slice(-window), bx = b.slice(-window);
    const n = Math.min(ax.length, bx.length);
    if (n < 5) return null;
    const aVals = ax.slice(0, n).map(d => d.value), bVals = bx.slice(0, n).map(d => d.value);
    const aM = aVals.reduce((s, v) => s + v, 0) / n, bM = bVals.reduce((s, v) => s + v, 0) / n;
    let num = 0, dA = 0, dB = 0;
    for (let i = 0; i < n; i++) {
      const da = aVals[i] - aM, db = bVals[i] - bM;
      num += da * db; dA += da * da; dB += db * db;
    }
    return dA && dB ? Math.round((num / Math.sqrt(dA * dB)) * 1000) / 1000 : 0;
  }

  const epuM = data.rt.epu_us_monthly || [];
  if (g.length > 12 && epuM.length > 12) {
    results.push({ asset: 'EPU (Policy)', timeframe: '30q', value: rollingCorr(g, epuM, 12), insight: 'WUI vs US Economic Policy Uncertainty — measures co-movement of global and US-specific uncertainty.' });
    results.push({ asset: 'EPU (Policy)', timeframe: '60q', value: rollingCorr(g, epuM, 24), insight: 'Longer-term structural relationship.' });
  }

  const adv = data.regions.advanced || [], emg = data.regions.emerging || [];
  if (adv.length > 12 && emg.length > 12) {
    results.push({ asset: 'Adv vs Emg', timeframe: '30q', value: rollingCorr(adv, emg, 12), insight: 'Advanced vs Emerging economy uncertainty convergence/divergence.' });
  }

  if (g.length > 12 && adv.length > 12) {
    results.push({ asset: 'Global vs Advanced', timeframe: '30q', value: rollingCorr(g, adv, 12), insight: 'How closely global uncertainty tracks advanced economies.' });
  }

  const emvD = data.rt.emv_daily || [], epuD = data.rt.epu_us_daily || [];
  if (emvD.length > 60 && epuD.length > 60) {
    results.push({ asset: 'EPU vs EMV (Daily)', timeframe: '60d', value: rollingCorr(epuD, emvD, 60), insight: 'Real-time correlation between policy uncertainty and market volatility.' });
  }

  return results;
}

// ── Country Rankings ──
function computeCountries(data) {
  const list = [];
  const names = { us: 'United States', china: 'China', uk: 'United Kingdom', germany: 'Germany', japan: 'Japan', india: 'India', brazil: 'Brazil', france: 'France', canada: 'Canada', australia: 'Australia', russia: 'Russia', south_korea: 'South Korea', mexico: 'Mexico', italy: 'Italy', spain: 'Spain', saudi_arabia: 'Saudi Arabia', turkey: 'Turkey', south_africa: 'South Africa', nigeria: 'Nigeria', egypt: 'Egypt', argentina: 'Argentina' };
  for (const [k, name] of Object.entries(names)) {
    const d = data.countries[k];
    if (!d || d.length < 2) continue;
    const last = d[d.length - 1], prev = d[d.length - 2];
    const chg = ((last.value - prev.value) / prev.value) * 100;
    list.push({ country: name, key: k, uncertainty_score: Math.round(last.value * 100) / 100, change_percent: Math.round(chg * 100) / 100, reason: chg > 10 ? 'Sharp rise in domestic uncertainty drivers' : chg > 0 ? 'Moderate increase in uncertainty' : chg > -10 ? 'Uncertainty easing slightly' : 'Significant uncertainty decline' });
  }
  return list.sort((a, b) => b.change_percent - a.change_percent);
}

// ── Alert Engine ──
function computeAlerts(liveWUI, data) {
  const alerts = [];
  const ts = new Date().toISOString();

  if (liveWUI && Math.abs(liveWUI.change_percent) > 10) {
    alerts.push({ id: 'wui_spike', title: `WUI ${liveWUI.direction === 'rising' ? 'Spike' : 'Drop'}: ${liveWUI.change_percent > 0 ? '+' : ''}${liveWUI.change_percent}%`, urgency: Math.abs(liveWUI.change_percent) > 20 ? 'critical' : 'high', description: `Global uncertainty moved ${Math.abs(liveWUI.change_percent)}% QoQ — exceeds 10% threshold.`, timestamp: ts });
  }

  const epuD = data.rt.epu_us_daily || [];
  if (epuD.length >= 10) {
    const r = epuD.slice(-5), p = epuD.slice(-10, -5);
    const ra = r.reduce((s, d) => s + d.value, 0) / 5, pa = p.reduce((s, d) => s + d.value, 0) / p.length;
    const chg = ((ra - pa) / pa) * 100;
    if (Math.abs(chg) > 15) {
      alerts.push({ id: 'epu_shift', title: `US EPU ${chg > 0 ? 'Surge' : 'Drop'}: ${chg > 0 ? '+' : ''}${chg.toFixed(1)}%`, urgency: Math.abs(chg) > 30 ? 'high' : 'medium', description: '5-day EPU average vs prior 5 days shows significant shift.', timestamp: ts });
    }
  }

  const emvD = data.rt.emv_daily || [];
  if (emvD.length >= 10) {
    const r = emvD.slice(-5), p = emvD.slice(-10, -5);
    const ra = r.reduce((s, d) => s + d.value, 0) / 5, pa = p.reduce((s, d) => s + d.value, 0) / p.length;
    const chg = ((ra - pa) / pa) * 100;
    if (Math.abs(chg) > 15) {
      alerts.push({ id: 'emv_shift', title: `Market Vol ${chg > 0 ? 'Spike' : 'Drop'}: ${chg > 0 ? '+' : ''}${chg.toFixed(1)}%`, urgency: Math.abs(chg) > 30 ? 'high' : 'medium', description: 'Equity market volatility showing sharp 5-day move.', timestamp: ts });
    }
  }

  if (liveWUI && data.global.length > 20) {
    const avg = data.global.reduce((s, d) => s + d.value, 0) / data.global.length;
    const above = ((liveWUI.value - avg) / avg) * 100;
    if (above > 50) {
      alerts.push({ id: 'above_mean', title: `WUI ${above.toFixed(0)}% Above Historical Mean`, urgency: above > 80 ? 'high' : 'medium', description: `Current level significantly elevated vs long-run average of ${avg.toFixed(0)}.`, timestamp: ts });
    }
  }

  if (!alerts.length) alerts.push({ id: 'clear', title: 'All Clear', urgency: 'low', description: 'Indicators within normal thresholds.', timestamp: ts });
  return alerts;
}

// ── Trading Signal Engine ──
function computeSignals(liveWUI) {
  if (!liveWUI) return [];
  const d = liveWUI.direction, c = liveWUI.confidence, ch = Math.abs(liveWUI.change_percent);
  const eqSig = d === 'rising' && c !== 'low' ? 'bearish' : d === 'falling' && c !== 'low' ? 'bullish' : 'neutral';
  const oilSig = d === 'rising' ? 'bullish' : 'neutral';
  const btcSig = d === 'rising' && ch > 8 ? 'bullish' : 'neutral';
  const vixSig = d === 'rising' ? 'bullish' : d === 'falling' ? 'bearish' : 'neutral';
  return [
    { asset: 'S&P 500', signal: eqSig, confidence: c, reason: eqSig === 'bearish' ? 'Rising uncertainty compresses multiples.' : eqSig === 'bullish' ? 'Falling uncertainty supports risk appetite.' : 'No clear directional edge.' },
    { asset: 'Oil', signal: oilSig, confidence: c, reason: oilSig === 'bullish' ? 'Geopolitical uncertainty correlates with energy supply risk.' : 'Energy stable as uncertainty normalizes.' },
    { asset: 'VIX', signal: vixSig, confidence: c, reason: vixSig === 'bullish' ? 'Rising WUI historically precedes VIX expansion.' : vixSig === 'bearish' ? 'Falling WUI supports vol compression.' : 'VIX likely range-bound.' },
    { asset: 'BTC', signal: btcSig, confidence: c, reason: btcSig === 'bullish' ? 'Acute uncertainty drives capital to non-sovereign stores of value.' : 'Normalized uncertainty reduces safe-haven narrative.' }
  ];
}

// ── Narrative Engine ──
function computeNarrative(liveWUI, countries, headlines) {
  if (!liveWUI) return 'Awaiting data...';
  let text = '';
  if (liveWUI.direction === 'rising') {
    text += `Global uncertainty is ${Math.abs(liveWUI.change_percent) > 10 ? 'surging' : 'climbing'} — live WUI at ${liveWUI.value.toFixed(0)}, up ${Math.abs(liveWUI.change_percent).toFixed(1)}% QoQ. `;
  } else if (liveWUI.direction === 'falling') {
    text += `Uncertainty is receding — live WUI at ${liveWUI.value.toFixed(0)}, down ${Math.abs(liveWUI.change_percent).toFixed(1)}% QoQ. `;
  } else {
    text += `Uncertainty holding at ${liveWUI.value.toFixed(0)} — flat QoQ, surface calm may mask structural stress. `;
  }
  if (liveWUI.momentum > 2) text += 'Momentum accelerating — rate of change increasing. ';
  else if (liveWUI.momentum < -2) text += 'Momentum decelerating — pressure easing. ';

  const top = countries.filter(c => c.change_percent > 0).slice(0, 2);
  if (top.length) text += `${top.map(c => c.country).join(' and ')} leading the move. `;

  if (headlines.length) text += `Key signal: ${headlines[0].text.split('—')[0].trim()}.`;
  return text;
}

// ── Social Post Engine ──
function computeSocialPost(liveWUI) {
  if (!liveWUI) return '';
  if (liveWUI.direction === 'rising') {
    return `Global uncertainty just spiked — WUI at ${liveWUI.value.toFixed(0)} (+${Math.abs(liveWUI.change_percent).toFixed(1)}%)\n\nConfidence: ${liveWUI.confidence.toUpperCase()}\n\nThis isn't noise. The macro landscape is shifting.\n\n$WUI`;
  } else if (liveWUI.direction === 'falling') {
    return `Uncertainty easing — WUI drops to ${liveWUI.value.toFixed(0)} (${liveWUI.change_percent.toFixed(1)}%)\n\nBut don't get comfortable.\nStructural risks haven't vanished — they're repricing.\n\n$WUI`;
  }
  return `WUI steady at ${liveWUI.value.toFixed(0)} — but the calm won't last.\n\nMarkets are coiling. When uncertainty breaks direction, positioning matters.\n\n$WUI`;
}

// ── Scenario Engine ──
function simulate(scenarioKey) {
  const s = SCENARIOS[scenarioKey];
  if (!s) return null;
  return { scenario: s.title, expected_wui_reaction: s.wui, historical_analog: s.analog, market_impact: { equities: s.eq, oil: s.oil, crypto: s.crypto } };
}

// ── Full Engine Run ──
async function run(fetchFn) {
  try {
    const SERIES_MAP = {
      global_simple: 'WUIGLOBALSMPAVG', advanced: 'WUIADVECON', emerging: 'WUIEMERGE',
      europe: 'WUIEUROPE', asia_pacific: 'WUIASIAPACIFIC', africa: 'WUIAFRICA',
      middle_east: 'WUIMIDEAST', latin_america: 'WUIWEST',
      us: 'WUIUSA', china: 'WUICHN', uk: 'WUIGBR', germany: 'WUIDEU',
      japan: 'WUIJPN', india: 'WUIIND', brazil: 'WUIBRA', france: 'WUIFRA',
      canada: 'WUICAN', australia: 'WUIAUS', russia: 'WUIRUS',
      south_korea: 'WUIKOR', mexico: 'WUIMEX', italy: 'WUIITA', spain: 'WUIESP',
      saudi_arabia: 'WUISAU', turkey: 'WUITUR', south_africa: 'WUIZAF',
      nigeria: 'WUINGA', egypt: 'WUIEGY', argentina: 'WUIARG',
      epu_us_daily: 'USEPUINDXD', epu_us_monthly: 'USEPUINDXM', emv_daily: 'WLEMUINDXD'
    };

    const countryKeys = ['us', 'china', 'uk', 'germany', 'japan', 'india', 'brazil', 'france', 'canada', 'australia', 'russia', 'south_korea', 'mexico', 'italy', 'spain', 'saudi_arabia', 'turkey', 'south_africa', 'nigeria', 'egypt', 'argentina'];
    const regionKeys = ['advanced', 'emerging', 'europe', 'asia_pacific', 'africa', 'middle_east', 'latin_america'];
    const rtKeys = ['epu_us_daily', 'epu_us_monthly', 'emv_daily'];

    const allKeys = ['global_simple', ...regionKeys, ...countryKeys, ...rtKeys];
    const fetched = {};
    await Promise.all(allKeys.map(async k => {
      try { fetched[k] = await fetchFn(SERIES_MAP[k]); } catch (_) {}
    }));

    const engineData = {
      global: fetched.global_simple || [],
      regions: {}, countries: {}, rt: {}
    };
    for (const k of regionKeys) engineData.regions[k] = fetched[k] || [];
    for (const k of countryKeys) engineData.countries[k] = fetched[k] || [];
    for (const k of rtKeys) engineData.rt[k] = fetched[k] || [];

    const headlines = generateHeadlines(engineData);
    const liveWUI = computeLiveWUI(engineData, headlines);
    const correlations = computeCorrelations(engineData);
    const countries = computeCountries(engineData);
    const alerts = computeAlerts(liveWUI, engineData);
    const signals = computeSignals(liveWUI);
    const narrative = computeNarrative(liveWUI, countries, headlines);
    const socialPost = computeSocialPost(liveWUI);

    state.live_wui = liveWUI;
    state.headlines = headlines;
    state.correlations = correlations;
    state.countries = countries;
    state.alerts = alerts;
    state.trade_signals = signals;
    state.insight = narrative;
    state.social_post = socialPost;
    state.chart = (engineData.global || []).map(d => ({ time: d.date, value: d.value }));
    state.last_update = new Date().toISOString();
    state.cycle_count++;

    console.log(`  [Engine] Cycle ${state.cycle_count} complete — WUI: ${liveWUI?.value?.toFixed(1) || '?'} (${liveWUI?.direction || '?'})`);
    return getFullOutput();
  } catch (err) {
    console.error('  [Engine] Run failed:', err.message);
    return null;
  }
}

function getFullOutput() {
  return {
    live_wui: state.live_wui,
    chart: state.chart,
    correlations: state.correlations,
    insight: state.insight,
    countries: state.countries,
    alerts: state.alerts,
    trade_signal: state.trade_signals,
    news: state.headlines,
    social_post: state.social_post,
    last_update: state.last_update
  };
}

module.exports = { run, simulate, getFullOutput, state, scoreHeadline };
