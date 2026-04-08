/* ═══════════════════════════════════════════════════
   WUI Intelligence Engine
   Transforms raw WUI data into actionable,
   trader-focused insights and structured outputs.
   ═══════════════════════════════════════════════════ */

const CONTRACT_ADDRESS = 'FfPryhuC6Bahn6agpLe2X1gaibsPpZbR1gn49KW7pump';

const SCENARIOS = {
  oil_120: {
    title: 'Oil Hits $120/barrel',
    wui_reaction: '+15–25%',
    wui_detail: 'Energy-driven uncertainty produces sharp WUI spikes. Supply disruptions cascade through manufacturing, transport, and consumer prices globally.',
    analog: '2022 energy shock post-Russia invasion — WUI surged ~40% in one quarter as energy supply chains fractured.',
    markets: {
      equities: 'Bearish — cost pressure squeezes margins across industrials, transport, consumer discretionary.',
      oil: 'Bullish — supply constraints dominate. Energy equities outperform.',
      crypto: 'Mixed — BTC may rally as inflation hedge, but risk-off drags altcoins.'
    }
  },
  china_taiwan: {
    title: 'China-Taiwan Escalation',
    wui_reaction: '+30–50%',
    wui_detail: 'Semiconductor supply chain paralysis would trigger the most severe uncertainty event since COVID. Global trade disruption immediate and severe.',
    analog: '2020 COVID onset — WUI spiked ~70% as global supply chains froze overnight.',
    markets: {
      equities: 'Severely bearish — tech sector devastation, TSMC supply chain wipeout. Nikkei, KOSPI in freefall.',
      oil: 'Bullish — shipping route disruption through Taiwan Strait, 40% of global trade tonnage at risk.',
      crypto: 'Bullish short-term — capital flight to non-sovereign assets. BTC as digital gold narrative strengthens.'
    }
  },
  fed_surprise: {
    title: 'Fed Emergency Rate Cut',
    wui_reaction: '+8–15%',
    wui_detail: 'Emergency cuts signal the Fed sees something the market doesn\'t. Initial relief quickly replaced by "what\'s broken?" anxiety.',
    analog: 'March 2020 emergency cut — WUI already elevated from COVID, cut amplified fear before stabilizing.',
    markets: {
      equities: 'Short-term bullish, medium-term bearish — liquidity pop then reality of why they cut.',
      oil: 'Bearish — demand destruction fears dominate if cut signals recession.',
      crypto: 'Bullish — rate cuts weaken USD, liquidity expansion favors risk assets.'
    }
  },
  recession: {
    title: 'Global Recession Signal',
    wui_reaction: '+20–35%',
    wui_detail: 'Coordinated global slowdown drives sustained uncertainty elevation. Unlike event shocks, recession uncertainty is persistent and compounds.',
    analog: '2008 GFC — WUI remained elevated for 6+ quarters as recession deepened and contagion spread.',
    markets: {
      equities: 'Bearish — earnings downgrades, multiple compression. Defensives and quality outperform.',
      oil: 'Bearish — demand destruction overwhelms supply concerns.',
      crypto: 'Bearish — risk-off dominates. Correlation with equities increases during stress.'
    }
  },
  pandemic: {
    title: 'Pandemic Resurgence',
    wui_reaction: '+25–45%',
    wui_detail: 'New pandemic variant or novel pathogen would re-trigger supply chain fears, border closures, and demand shock simultaneously.',
    analog: 'Q1 2020 COVID — WUI hit all-time highs. Every region simultaneously affected.',
    markets: {
      equities: 'Severely bearish — lockdown fears crush cyclicals. Stay-at-home basket rallies.',
      oil: 'Bearish — travel demand collapse. 2020 saw oil briefly go negative.',
      crypto: 'Initially bearish (liquidity crunch), then bullish (stimulus expectations).'
    }
  },
  trade_war: {
    title: 'Full Trade War Escalation',
    wui_reaction: '+12–22%',
    wui_detail: 'Universal tariffs above 30% would fragment global trade. WUI impact compounds as retaliatory measures cascade through supply chains.',
    analog: '2018-19 US-China trade war + 2025 Liberation Day tariffs — WUI elevated persistently during both episodes.',
    markets: {
      equities: 'Bearish — margin compression from input cost inflation. Exporters hit hardest.',
      oil: 'Mixed — demand destruction vs supply chain rerouting inefficiencies.',
      crypto: 'Mildly bullish — trade fragmentation increases appeal of borderless value transfer.'
    }
  }
};

const INTEL = {
  rendered: false,

  run(g, rt, c, reg) {
    const est = this.estimate(g, rt);
    const corrs = this.correlations(rt);
    const impacts = this.eventImpacts(g);
    const countries = this.rankCountries(c);
    const narr = this.narrative(est, countries, impacts);
    const social = this.socialPost(est, narr);
    const alerts = this.checkAlerts(est, rt, g);
    const signals = this.tradingSignals(est, rt);

    const json = {
      wui_estimate: parseFloat(est.value.toFixed(2)),
      direction: est.direction,
      confidence: est.confidence,
      top_events: impacts.slice(0, 3).map(e => ({ event: e.label, impact_pct: parseFloat(e.impact.toFixed(1)), severity: e.impactLabel })),
      country_rankings: {
        rising: countries.rising.slice(0, 5).map(x => ({ country: x.n, change_pct: parseFloat(x.c.toFixed(1)) })),
        falling: countries.falling.slice(0, 5).map(x => ({ country: x.n, change_pct: parseFloat(x.c.toFixed(1)) }))
      },
      insight: narr.text,
      alerts: alerts.map(a => ({ title: a.title, urgency: a.urgency })),
      social_post: social.text,
      signals: signals.map(s => ({ market: s.market, signal: s.signal }))
    };

    this.renderAll(est, corrs, impacts, countries, narr, social, alerts, signals, json);
    this.rendered = true;
    return json;
  },

  // ── Task 1: Real-Time WUI Estimation ──
  estimate(g, rt) {
    if (!g || !g.length) return { value: 0, change: 0, direction: 'stable', confidence: 'low', date: '' };
    const last = g[g.length - 1], prev = g[g.length - 2];
    const change = prev ? pct(last.value, prev.value) : 0;
    const direction = change > 3 ? 'rising' : change < -3 ? 'falling' : 'stable';

    let agree = 0, total = 0;
    const epuD = rt.epu_us_daily || [], emvD = rt.emv_daily || [];
    if (epuD.length >= 20) {
      total++;
      const r = epuD.slice(-20);
      const t = pct(r[r.length - 1].value, r[0].value);
      if ((t > 0 && change > 0) || (t < 0 && change < 0)) agree++;
    }
    if (emvD.length >= 20) {
      total++;
      const r = emvD.slice(-20);
      const t = pct(r[r.length - 1].value, r[0].value);
      if ((t > 0 && change > 0) || (t < 0 && change < 0)) agree++;
    }
    const confidence = total === 0 ? 'medium' : agree === total ? 'high' : agree > 0 ? 'medium' : 'low';
    return { value: last.value, change, direction, confidence, date: last.date };
  },

  // ── Task 2: Market Correlation Analysis ──
  correlations(rt) {
    const result = [];
    const epuD = rt.epu_us_daily || [], emvD = rt.emv_daily || [], epuM = rt.epu_us_monthly || [];

    if (epuD.length > 30 && emvD.length > 30) {
      const epu30 = epuD.slice(-30), emv30 = emvD.slice(-30);
      const epuT = pct(epu30[epu30.length - 1].value, epu30[0].value);
      const emvT = pct(emv30[emv30.length - 1].value, emv30[0].value);
      const same = (epuT > 0 && emvT > 0) || (epuT < 0 && emvT < 0);
      result.push({
        pair: 'EPU vs Market Vol',
        corr: same ? 'Positive' : 'Diverging',
        color: same ? '#22c55e' : '#ef4444',
        insight: same
          ? `Policy uncertainty and market volatility moving together (${epuT > 0 ? 'both rising' : 'both falling'}) — reinforcing macro stress signal.`
          : `Divergence: EPU ${epuT > 0 ? 'rising' : 'falling'} while market vol ${emvT > 0 ? 'rising' : 'falling'} — watch for convergence.`
      });
    }

    if (epuD.length > 5 && epuM.length > 2) {
      const dLast = epuD[epuD.length - 1].value, mLast = epuM[epuM.length - 1].value;
      const ratio = dLast / mLast;
      const label = ratio > 1.2 ? 'Daily Elevated' : ratio < 0.8 ? 'Daily Depressed' : 'Aligned';
      result.push({
        pair: 'Daily vs Monthly EPU',
        corr: label,
        color: ratio > 1.2 ? '#ef4444' : ratio < 0.8 ? '#22c55e' : '#eab308',
        insight: ratio > 1.2
          ? 'Daily EPU running above monthly trend — acute short-term uncertainty spike in progress.'
          : ratio < 0.8
            ? 'Daily EPU below monthly — near-term easing, but structural concerns persist.'
            : 'Daily and monthly EPU aligned — current uncertainty reflects the established trend.'
      });
    }

    if (emvD.length > 60) {
      const r60 = emvD.slice(-60), r30 = emvD.slice(-30);
      const avg60 = r60.reduce((s, d) => s + d.value, 0) / r60.length;
      const avg30 = r30.reduce((s, d) => s + d.value, 0) / r30.length;
      const momentum = pct(avg30, avg60);
      result.push({
        pair: 'Volatility Momentum',
        corr: momentum > 5 ? 'Accelerating' : momentum < -5 ? 'Decelerating' : 'Steady',
        color: momentum > 5 ? '#ef4444' : momentum < -5 ? '#22c55e' : '#eab308',
        insight: momentum > 5
          ? `Market volatility accelerating — 30d avg ${pct(avg30, avg60) > 0 ? 'above' : 'below'} 60d avg. Stress building.`
          : momentum < -5
            ? 'Volatility decelerating — near-term calm returning, but watch for complacency.'
            : 'Volatility stable — no clear momentum shift in market stress indicators.'
      });
    }

    return result;
  },

  // ── Task 3: Event Impact Detection ──
  eventImpacts(g) {
    const recent = EVENTS.filter(e => parseInt(e.date) >= 2022);
    return recent.map(e => {
      const eDate = pd(e.date);
      let ci = -1, cd = Infinity;
      g.forEach((d, i) => { const dist = Math.abs(pd(d.date) - eDate); if (dist < cd) { cd = dist; ci = i; } });
      let impact = 0, impactLabel = 'minimal';
      if (ci > 0 && ci < g.length) {
        impact = pct(g[ci].value, g[ci - 1].value);
        impactLabel = Math.abs(impact) > 15 ? 'severe' : Math.abs(impact) > 8 ? 'significant' : Math.abs(impact) > 3 ? 'moderate' : 'minimal';
      }
      return { ...e, impact, impactLabel, wuiAtEvent: ci >= 0 ? g[ci].value : null };
    }).reverse();
  },

  // ── Task 4: Country-Level Breakdown ──
  rankCountries(c) {
    const list = Object.entries(COUNTRIES).map(([k, n]) => {
      const d = c[k];
      if (!d || d.length < 2) return null;
      const last = d[d.length - 1], prev = d[d.length - 2];
      const change = pct(last.value, prev.value);
      const ctx = CTX[k];
      return { k, n, v: last.value, c: change, reason: ctx ? ctx.outlook : '', risk: ctx?.risk || 'unknown' };
    }).filter(Boolean).sort((a, b) => b.c - a.c);
    return {
      rising: list.filter(x => x.c > 0).slice(0, 5),
      falling: [...list].filter(x => x.c < 0).sort((a, b) => a.c - b.c).slice(0, 5)
    };
  },

  // ── Task 5: AI Narrative Generation ──
  narrative(est, countries, impacts) {
    let text = '';
    if (est.direction === 'rising') {
      text += `Global uncertainty is ${Math.abs(est.change) > 10 ? 'surging' : 'climbing'} — WUI at ${fmt(est.value)}, up ${Math.abs(est.change).toFixed(1)}% QoQ. `;
    } else if (est.direction === 'falling') {
      text += `Uncertainty is receding — WUI at ${fmt(est.value)}, down ${Math.abs(est.change).toFixed(1)}% QoQ. `;
    } else {
      text += `Uncertainty holding steady at ${fmt(est.value)} — flat QoQ, but surface calm may mask underlying stress. `;
    }
    if (countries.rising.length > 0) {
      const top = countries.rising[0];
      text += `${top.n} leads the upside move (+${top.c.toFixed(1)}%). `;
    }
    if (countries.falling.length > 0) {
      const bot = countries.falling[0];
      text += `${bot.n} showing the sharpest decline (${bot.c.toFixed(1)}%). `;
    }
    if (impacts.length > 0) {
      text += `Key catalyst: ${impacts[0].label} — ${impacts[0].desc}`;
    }
    return { text, direction: est.direction };
  },

  // ── Task 6: Social Media Content (X Posts) ──
  socialPost(est, narr) {
    let text = '';
    if (est.direction === 'rising') {
      text = `Global uncertainty just spiked — WUI at ${fmt(est.value)} (+${Math.abs(est.change).toFixed(1)}%)\n\nConfidence: ${est.confidence.toUpperCase()}\n\nThis isn't noise. The macro landscape is shifting.\n\n$WUI`;
    } else if (est.direction === 'falling') {
      text = `Uncertainty easing — WUI drops to ${fmt(est.value)} (${est.change.toFixed(1)}%)\n\nBut don't get comfortable.\nStructural risks haven't vanished — they're repricing.\n\n$WUI`;
    } else {
      text = `WUI steady at ${fmt(est.value)} — but the calm won't last.\n\nMarkets are coiling. When uncertainty breaks direction, positioning matters.\n\n$WUI`;
    }
    return { text };
  },

  // ── Task 7: Alert System ──
  checkAlerts(est, rt, g) {
    const alerts = [];
    if (Math.abs(est.change) > 10) {
      alerts.push({
        title: `WUI ${est.direction === 'rising' ? 'Spike' : 'Drop'}: ${est.change > 0 ? '+' : ''}${est.change.toFixed(1)}%`,
        desc: `Global uncertainty moved ${Math.abs(est.change).toFixed(1)}% QoQ — exceeds 10% alert threshold.`,
        urgency: Math.abs(est.change) > 20 ? 'critical' : 'high'
      });
    }
    const epuD = rt.epu_us_daily || [];
    if (epuD.length >= 10) {
      const rec = epuD.slice(-5), pri = epuD.slice(-10, -5);
      const rA = rec.reduce((s, d) => s + d.value, 0) / rec.length;
      const pA = pri.reduce((s, d) => s + d.value, 0) / pri.length;
      const ch = pct(rA, pA);
      if (Math.abs(ch) > 15) {
        alerts.push({
          title: `US EPU ${ch > 0 ? 'Surge' : 'Drop'}: ${ch > 0 ? '+' : ''}${ch.toFixed(1)}%`,
          desc: '5-day EPU average vs prior 5 days shows significant policy uncertainty shift.',
          urgency: Math.abs(ch) > 30 ? 'high' : 'medium'
        });
      }
    }
    const emvD = rt.emv_daily || [];
    if (emvD.length >= 10) {
      const rec = emvD.slice(-5), pri = emvD.slice(-10, -5);
      const rA = rec.reduce((s, d) => s + d.value, 0) / rec.length;
      const pA = pri.reduce((s, d) => s + d.value, 0) / pri.length;
      const ch = pct(rA, pA);
      if (Math.abs(ch) > 15) {
        alerts.push({
          title: `Market Volatility ${ch > 0 ? 'Spike' : 'Drop'}: ${ch > 0 ? '+' : ''}${ch.toFixed(1)}%`,
          desc: 'Equity market volatility tracker showing sharp 5-day move.',
          urgency: Math.abs(ch) > 30 ? 'high' : 'medium'
        });
      }
    }
    if (g.length > 20) {
      const avg = g.reduce((s, d) => s + d.value, 0) / g.length;
      const above = pct(g[g.length - 1].value, avg);
      if (above > 50) {
        alerts.push({
          title: `WUI ${above.toFixed(0)}% Above Historical Mean`,
          desc: `Current level significantly elevated vs long-run average of ${fmt(avg)}.`,
          urgency: above > 80 ? 'high' : 'medium'
        });
      }
    }
    if (!alerts.length) {
      alerts.push({ title: 'All Clear', desc: 'All indicators within normal thresholds. Monitoring continues.', urgency: 'low' });
    }
    return alerts;
  },

  // ── Task 8: Trading Insight Mode ──
  tradingSignals(est, rt) {
    const eqSig = est.direction === 'rising' && est.confidence !== 'low' ? 'bearish'
      : est.direction === 'falling' && est.confidence !== 'low' ? 'bullish' : 'neutral';
    const oilSig = est.direction === 'rising' ? 'bullish' : 'neutral';
    const cryptoSig = est.direction === 'rising' && Math.abs(est.change) > 8 ? 'bullish'
      : est.direction === 'falling' ? 'neutral' : 'neutral';

    return [
      {
        market: 'Equities',
        signal: eqSig,
        reason: eqSig === 'bearish'
          ? 'Rising uncertainty compresses multiples and widens risk premia. Favor defensives, reduce beta.'
          : eqSig === 'bullish'
            ? 'Falling uncertainty supports risk appetite. Broad market tailwind as risk premia compress.'
            : 'Uncertainty in transition zone. No clear directional edge — reduce position sizes.'
      },
      {
        market: 'Oil / Energy',
        signal: oilSig,
        reason: oilSig === 'bullish'
          ? 'Geopolitical uncertainty correlates with energy supply risk. Oil tends to bid in uncertain regimes.'
          : 'Energy markets stable as macro uncertainty normalizes. Range-bound conditions likely.'
      },
      {
        market: 'Crypto / BTC',
        signal: cryptoSig,
        reason: cryptoSig === 'bullish'
          ? 'Acute uncertainty spikes drive capital into non-sovereign stores of value. BTC benefits from hedging flows.'
          : 'Normalized uncertainty reduces crypto\'s safe-haven narrative. Follows broader risk appetite.'
      }
    ];
  },

  // ── Task 9: Scenario Simulation ──
  renderScenario(key) {
    const el = document.getElementById('i-scn-result');
    if (!key || !SCENARIOS[key]) {
      el.innerHTML = '<div style="color:var(--txm);font-size:.78rem;padding:20px;text-align:center">Select a scenario to simulate</div>';
      return;
    }
    const s = SCENARIOS[key];
    el.innerHTML = `
      <div class="scn-card"><div class="scn-label">Expected WUI Reaction</div><div class="scn-val" style="color:#ef4444">${s.wui_reaction}</div><div class="scn-desc">${s.wui_detail}</div></div>
      <div class="scn-card"><div class="scn-label">Historical Analog</div><div class="scn-val" style="color:var(--acl)">Precedent</div><div class="scn-desc">${s.analog}</div></div>
      <div class="scn-card"><div class="scn-label">Market Impact</div><div class="scn-desc"><div style="margin-bottom:4px"><strong style="color:var(--wh)">Equities:</strong> ${s.markets.equities}</div><div style="margin-bottom:4px"><strong style="color:var(--wh)">Oil:</strong> ${s.markets.oil}</div><div><strong style="color:var(--wh)">Crypto:</strong> ${s.markets.crypto}</div></div></div>`;
  },

  // ── Task 10: UI Output / Render ──
  renderAll(est, corrs, impacts, countries, narr, social, alerts, signals, json) {
    // Pulse
    const dirEl = document.getElementById('i-dir');
    if (dirEl) {
      dirEl.textContent = est.direction.toUpperCase();
      dirEl.className = 'pulse-badge ' + est.direction;
    }
    const valEl = document.getElementById('i-val');
    if (valEl) {
      valEl.textContent = fmt(est.value);
      valEl.style.color = est.direction === 'rising' ? '#ef4444' : est.direction === 'falling' ? '#22c55e' : '#eab308';
    }
    const dirVEl = document.getElementById('i-dirv');
    if (dirVEl) {
      dirVEl.textContent = est.direction === 'rising' ? '\u2191' : est.direction === 'falling' ? '\u2193' : '\u2192';
      dirVEl.style.color = valEl ? valEl.style.color : '';
    }
    const confEl = document.getElementById('i-conf');
    if (confEl) {
      confEl.textContent = est.confidence.toUpperCase();
      confEl.style.color = est.confidence === 'high' ? '#22c55e' : est.confidence === 'low' ? '#ef4444' : '#eab308';
    }
    const qoqEl = document.getElementById('i-qoq');
    if (qoqEl) {
      qoqEl.textContent = fP(est.change);
      qoqEl.style.color = est.change >= 0 ? '#ef4444' : '#22c55e';
    }
    const perEl = document.getElementById('i-per');
    if (perEl) perEl.textContent = est.date ? 'as of ' + dl(est.date) : '';

    // Alerts
    const aEl = document.getElementById('i-alerts');
    if (aEl) aEl.innerHTML = alerts.map(a =>
      `<div class="alert-card"><div class="alert-dot ${a.urgency}"></div><div class="alert-body"><div class="alert-title">${a.title}</div><div class="alert-desc">${a.desc}</div></div><span class="alert-urgency ${a.urgency}">${a.urgency}</span></div>`
    ).join('');

    // Trading Signals
    const tEl = document.getElementById('i-trades');
    if (tEl) tEl.innerHTML = signals.map(s =>
      `<div class="trade-card"><div class="tc-market">${s.market}</div><div class="tc-signal ${s.signal}">${s.signal.toUpperCase()}</div><div class="tc-reason">${s.reason}</div></div>`
    ).join('');

    // Correlations
    const cEl = document.getElementById('i-corrs');
    if (cEl) cEl.innerHTML = corrs.length ? corrs.map(c =>
      `<div class="corr-item"><div class="corr-pair">${c.pair}</div><div class="corr-val" style="color:${c.color}">${c.corr}</div><div class="corr-insight">${c.insight}</div></div>`
    ).join('') : '<div style="color:var(--txm);font-size:.78rem;padding:16px">Insufficient supplementary data for correlation analysis.</div>';

    // Narrative
    const nEl = document.getElementById('i-narr');
    if (nEl) nEl.innerHTML = `<div class="narr-q">Why is uncertainty ${est.direction}?</div><div class="narr-text">${narr.text}</div>`;

    // Social Post
    const sEl = document.getElementById('i-social');
    if (sEl) sEl.innerHTML = `<div class="sp-platform">\uD835\uDD4F Post — Ready to publish</div><button class="sp-copy" onclick="INTEL.copySocial()">Copy</button><div class="sp-body">${social.text}</div>`;

    // Country Intel
    const ciEl = document.getElementById('i-countries');
    if (ciEl) {
      const risingHtml = countries.rising.length
        ? `<div><div style="font-size:.78rem;font-weight:700;color:var(--rd);margin-bottom:8px;font-family:'Space Grotesk',sans-serif">\u25B2 Rising Uncertainty</div><div class="ci-list">${countries.rising.map((x, i) =>
          `<div class="ci-item"><span class="ci-rank">${i + 1}</span><span class="ci-name">${x.n}</span><span class="ci-change" style="color:#ef4444;background:rgba(239,68,68,.1)">+${x.c.toFixed(1)}%</span><span class="ci-reason">${x.reason}</span></div>`
        ).join('')}</div></div>` : '';
      const fallingHtml = countries.falling.length
        ? `<div><div style="font-size:.78rem;font-weight:700;color:var(--gn);margin-bottom:8px;font-family:'Space Grotesk',sans-serif">\u25BC Falling Uncertainty</div><div class="ci-list">${countries.falling.map((x, i) =>
          `<div class="ci-item"><span class="ci-rank">${i + 1}</span><span class="ci-name">${x.n}</span><span class="ci-change" style="color:#22c55e;background:rgba(34,197,94,.1)">${x.c.toFixed(1)}%</span><span class="ci-reason">${x.reason}</span></div>`
        ).join('')}</div></div>` : '';
      ciEl.innerHTML = risingHtml + fallingHtml;
    }

    // Event Impacts
    const eEl = document.getElementById('i-events');
    if (eEl) eEl.innerHTML = impacts.slice(0, 8).map(e =>
      `<div style="display:flex;gap:12px;padding:12px 0;border-bottom:1px solid var(--brd);align-items:flex-start">
        <div style="width:90px;flex-shrink:0"><div style="font-family:'JetBrains Mono',monospace;font-size:.68rem;color:var(--txm)">${e.date.slice(0, 7)}</div><div style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-top:2px;color:${e.impactLabel === 'severe' ? '#ef4444' : e.impactLabel === 'significant' ? '#f97316' : e.impactLabel === 'moderate' ? '#eab308' : '#22c55e'}">${e.impactLabel}</div></div>
        <div style="flex:1"><div style="font-weight:700;font-size:.82rem;color:var(--wh);margin-bottom:2px">${e.label}</div><div style="font-size:.74rem;color:var(--tx2);line-height:1.5">${e.desc}</div></div>
        <div style="text-align:right;flex-shrink:0"><div style="font-family:'JetBrains Mono',monospace;font-size:.82rem;font-weight:700;color:${e.impact >= 0 ? '#ef4444' : '#22c55e'}">${e.impact >= 0 ? '+' : ''}${e.impact.toFixed(1)}%</div><div style="font-size:.62rem;color:var(--txm)">WUI impact</div></div></div>`
    ).join('');

    // JSON
    const jEl = document.getElementById('i-json');
    if (jEl) jEl.textContent = JSON.stringify(json, null, 2);

    // Scenario
    const sel = document.getElementById('i-scn-sel');
    if (sel) sel.onchange = () => this.renderScenario(sel.value);

    // JSON copy
    const jCopy = document.getElementById('i-json-copy');
    if (jCopy) jCopy.onclick = () => this.copyJson();
  },

  copySocial() {
    const body = document.querySelector('#i-social .sp-body');
    if (!body) return;
    navigator.clipboard.writeText(body.textContent).then(() => {
      const btn = document.querySelector('#i-social .sp-copy');
      if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 2000); }
    });
  },

  copyJson() {
    const pre = document.getElementById('i-json');
    if (!pre) return;
    navigator.clipboard.writeText(pre.textContent).then(() => {
      const btn = document.getElementById('i-json-copy');
      if (btn) { btn.textContent = 'Copied!'; setTimeout(() => btn.textContent = 'Copy', 2000); }
    });
  },

  // ── Headline Generation (client-side, from real FRED data) ──
  generateHeadlines(est, rt, countries) {
    const BOOSTS = { war: 3, conflict: 3, oil: 3, crisis: 4, tariff: 3, recession: 3, pandemic: 4, inflation: 2, rate: 2 };
    const headlines = [];
    const epuD = rt.epu_us_daily || [], emvD = rt.emv_daily || [], epuM = rt.epu_us_monthly || [];

    if (epuD.length >= 10) {
      const last5 = epuD.slice(-5), prev5 = epuD.slice(-10, -5);
      const a5 = last5.reduce((s, d) => s + d.value, 0) / 5;
      const p5 = prev5.reduce((s, d) => s + d.value, 0) / prev5.length;
      const chg = pct(a5, p5);
      headlines.push({ text: `US Policy Uncertainty ${Math.abs(chg) > 10 ? (chg > 0 ? 'surges' : 'plunges') : (chg > 0 ? 'edges higher' : 'eases')} — 5-day avg at ${a5.toFixed(0)}`, cat: 'policy', score: Math.min(10, 4 + Math.abs(chg) / 4), date: epuD[epuD.length - 1].date, src: 'FRED EPU' });
    }
    if (emvD.length >= 10) {
      const last5 = emvD.slice(-5), prev5 = emvD.slice(-10, -5);
      const a5 = last5.reduce((s, d) => s + d.value, 0) / 5;
      const p5 = prev5.reduce((s, d) => s + d.value, 0) / prev5.length;
      const chg = pct(a5, p5);
      headlines.push({ text: `Market Volatility ${chg > 0 ? 'spikes' : 'retreats'} — tracker at ${a5.toFixed(0)}`, cat: 'markets', score: Math.min(10, 4 + Math.abs(chg) / 3), date: emvD[emvD.length - 1].date, src: 'FRED EMV' });
    }
    if (epuM.length >= 3) {
      const last = epuM[epuM.length - 1], prev = epuM[epuM.length - 2];
      const chg = pct(last.value, prev.value);
      headlines.push({ text: `Monthly US uncertainty ${chg > 0 ? 'climbs' : 'declines'} to ${last.value.toFixed(0)}`, cat: 'policy', score: Math.min(10, 3 + Math.abs(chg) / 5), date: last.date, src: 'FRED EPU-M' });
    }
    if (est.direction !== 'stable') {
      headlines.push({ text: `Global WUI ${est.direction === 'rising' ? 'rising' : 'falling'} — index at ${fmt(est.value)} (${fP(est.change)})`, cat: 'macro', score: Math.min(10, 5 + Math.abs(est.change) / 5), date: est.date, src: 'WUI Engine' });
    }

    const cList = countries.rising.concat(countries.falling).sort((a, b) => Math.abs(b.c) - Math.abs(a.c)).slice(0, 3);
    for (const c of cList) {
      headlines.push({ text: `${c.n} uncertainty ${c.c > 0 ? 'jumps' : 'drops'} ${Math.abs(c.c).toFixed(1)}% to ${fmt(c.v)}`, cat: 'country', score: Math.min(10, 3 + Math.abs(c.c) / 5), date: '', src: 'WUI Engine' });
    }

    return headlines.sort((a, b) => b.score - a.score).slice(0, 8);
  },

  // ── Dashboard Command Center Rendering ──
  renderDashboard(g, rt, c, reg) {
    const est = this.estimate(g, rt);
    const countries = this.rankCountries(c);
    const narr = this.narrative(est, countries, this.eventImpacts(g));
    const alerts = this.checkAlerts(est, rt, g);
    const signals = this.tradingSignals(est, rt);
    const headlines = this.generateHeadlines(est, rt, countries);

    // Hero
    const hVal = document.getElementById('h-val');
    if (hVal) hVal.textContent = fmt(est.value);
    const hDir = document.getElementById('h-dir');
    if (hDir) { hDir.textContent = est.direction === 'rising' ? '\u2191' : est.direction === 'falling' ? '\u2193' : '\u2192'; hDir.className = 'hero-dir ' + (est.direction === 'rising' ? 'up' : est.direction === 'falling' ? 'down' : 'flat'); }
    const hChg = document.getElementById('h-chg');
    if (hChg) { hChg.textContent = fP(est.change); hChg.className = 'hero-chg ' + (est.change >= 0 ? 'up' : 'down'); }
    const hConf = document.getElementById('h-conf');
    if (hConf) { hConf.textContent = est.confidence.toUpperCase() + ' CONFIDENCE'; hConf.className = 'hero-badge ' + est.confidence; }
    const hInsight = document.getElementById('h-insight');
    if (hInsight) hInsight.textContent = narr.text;

    // Hero stats
    if (g.length >= 2) {
      const last = g[g.length - 1], prev = g[g.length - 2];
      const vals = g.map(d => d.value), mx = Math.max(...vals);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const mm = last.date.slice(5, 7), yr = +last.date.slice(0, 4);
      const yoyPt = g.find(d => d.date.startsWith(`${yr - 1}-${mm}`));
      const yoy = yoyPt ? pct(last.value, yoyPt.value) : null;
      const vol = sd(filt(g, 5).map(d => d.value));
      const el = id => document.getElementById(id);
      if (el('h-qoq')) el('h-qoq').textContent = fP(est.change);
      if (el('h-yoy')) el('h-yoy').textContent = yoy != null ? fP(yoy) : '--';
      if (el('h-ath')) el('h-ath').textContent = fmt(mx);
      if (el('h-avg')) el('h-avg').textContent = fmt(avg);
      if (el('h-vol')) el('h-vol').textContent = fmt(vol);
      if (el('h-mom')) {
        let mom = 0;
        if (g.length >= 3) { const pp = g[g.length - 3]; mom = pct(last.value, prev.value) - pct(prev.value, pp.value); }
        el('h-mom').textContent = (mom >= 0 ? '+' : '') + mom.toFixed(1);
        el('h-mom').style.color = mom > 0 ? '#ef4444' : mom < 0 ? '#22c55e' : '';
      }
      const { q } = getQY(last.date);
      if (el('h-fresh')) el('h-fresh').textContent = `Q${q} ${yr}`;
    }

    // Hero clock
    const hClk = document.getElementById('h-clock');
    if (hClk) { const t = () => { hClk.textContent = new Date().toLocaleTimeString('en-US', { hour12: false }); }; t(); setInterval(t, 1000); }

    // Command Center — Trading Signals
    const tradeBody = document.getElementById('cmd-trade-body');
    if (tradeBody) {
      tradeBody.innerHTML = signals.map(s =>
        `<div class="cmd-sig"><span class="cs-asset">${s.market}</span><span class="cs-badge ${s.signal}">${s.signal}</span><span class="cs-reason">${s.reason.split('.')[0]}</span></div>`
      ).join('');
    }

    // Command Center — Alerts
    const alertsBody = document.getElementById('cmd-alerts-body');
    if (alertsBody) {
      alertsBody.innerHTML = alerts.map(a =>
        `<div class="cmd-alert"><span class="cmd-adot ${a.urgency}"></span><span class="cmd-atxt">${a.title}</span><span class="cmd-aurg">${a.urgency}</span></div>`
      ).join('');
    }

    // Command Center — Brief
    const briefBody = document.getElementById('cmd-brief-body');
    if (briefBody) briefBody.textContent = narr.text;

    // Headline Feed
    const hfBody = document.getElementById('hf-body');
    if (hfBody) {
      hfBody.innerHTML = headlines.map(h => {
        const cls = h.score >= 7 ? 's-high' : h.score >= 4 ? 's-med' : 's-low';
        return `<div class="hf-item"><span class="hf-score ${cls}">${h.score.toFixed(0)}</span><span class="hf-text">${h.text}</span><span class="hf-tag">${h.cat}</span></div>`;
      }).join('');
    }
  },

  initContractAddress() {
    const pill = document.getElementById('caPill');
    if (!pill) return;
    pill.addEventListener('click', () => {
      navigator.clipboard.writeText(CONTRACT_ADDRESS).then(() => {
        const toast = document.getElementById('caToast');
        if (toast) { toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2000); }
      });
    });
  }
};
