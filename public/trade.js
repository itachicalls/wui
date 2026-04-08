/* ═══════════════════════════════════════════════════
   WUI Prediction Markets — Kalshi-style
   Trade on real uncertainty outcomes.
   LMSR AMM. All settlements from FRED data.
   ═══════════════════════════════════════════════════ */

const TRADE = {
  B: 150,
  INIT_BAL: 1000,
  SK_M: 'wui_pm_markets_v3',
  SK_P: 'wui_pm_portfolio_v3',

  INST: {
    epu_daily:   { name: 'US EPU Daily',   short: 'EPU Daily',   key: 'epu_us_daily',   fred: 'USEPUINDXD',      freq: 'Daily',     round: 50 },
    emv_daily:   { name: 'Equity Mkt Vol', short: 'EMV',         key: 'emv_daily',      fred: 'WLEMUINDXD',      freq: 'Daily',     round: 25 },
    epu_monthly: { name: 'US EPU Monthly', short: 'EPU Monthly', key: 'epu_us_monthly', fred: 'USEPUINDXM',      freq: 'Monthly',   round: 50 },
    wui_global:  { name: 'WUI Global',     short: 'WUI',         key: 'global_simple',  fred: 'WUIGLOBALSMPAVG', freq: 'Quarterly', round: 5000 }
  },

  markets: [],
  portfolio: { balance: 1000, positions: [], history: [] },
  sel: null,
  side: 'yes',
  filter: 'all',
  chart: null,
  series: null,
  ready: false,

  // ── LMSR AMM ──────────────────────────────────────
  C(qy, qn) {
    const mx = Math.max(qy, qn, 0);
    return this.B * (mx + Math.log(Math.exp((qy - mx) / this.B) + Math.exp((qn - mx) / this.B)));
  },

  P(qy, qn, s) {
    const mx = Math.max(qy, qn, 0);
    const ey = Math.exp((qy - mx) / this.B);
    const en = Math.exp((qn - mx) / this.B);
    return s === 'yes' ? ey / (ey + en) : en / (ey + en);
  },

  buyCost(m, s, n) {
    const nqy = s === 'yes' ? m.qy + n : m.qy;
    const nqn = s === 'no' ? m.qn + n : m.qn;
    return this.C(nqy, nqn) - this.C(m.qy, m.qn);
  },

  sellProc(m, s, n) {
    const nqy = s === 'yes' ? m.qy - n : m.qy;
    const nqn = s === 'no' ? m.qn - n : m.qn;
    return this.C(m.qy, m.qn) - this.C(nqy, nqn);
  },

  // ── Data Access ───────────────────────────────────
  latest(id) {
    const inst = this.INST[id];
    if (!inst) return null;
    const d = id === 'wui_global' ? gData : (rtData[inst.key] || []);
    return d && d.length ? d[d.length - 1] : null;
  },

  hist(id) {
    const inst = this.INST[id];
    if (!inst) return [];
    return id === 'wui_global' ? (gData || []) : (rtData[inst.key] || []);
  },

  // ── Date Helpers ──────────────────────────────────
  nextBD() {
    const d = new Date(); d.setDate(d.getDate() + 1);
    while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  },

  endWeek() {
    const d = new Date();
    let add = (5 - d.getDay() + 7) % 7;
    if (add <= 1) add += 7;
    d.setDate(d.getDate() + add);
    return d.toISOString().split('T')[0];
  },

  endMonth() {
    const d = new Date();
    const em = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    if (em.getTime() - d.getTime() < 3 * 86400000) em.setMonth(em.getMonth() + 2, 0);
    return em.toISOString().split('T')[0];
  },

  endQtr() {
    const d = new Date();
    const q = Math.floor(d.getMonth() / 3);
    const eq = new Date(d.getFullYear(), (q + 1) * 3, 0);
    if (eq.getTime() - d.getTime() < 14 * 86400000) { eq.setMonth(eq.getMonth() + 3); eq.setDate(0); }
    return eq.toISOString().split('T')[0];
  },

  fmtDate(s) {
    return new Date(s + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  },

  daysLeft(s) {
    const ms = new Date(s + 'T23:59:59') - new Date();
    const d = Math.ceil(ms / 86400000);
    return d <= 0 ? 'Settling...' : d === 1 ? '1 day left' : d + ' days left';
  },

  // ── Probability Seeding ───────────────────────────
  hProb(data, thresh) {
    if (!data || data.length < 5) return 0.5;
    const r = data.slice(-30);
    return Math.max(0.1, Math.min(0.9, r.filter(d => d.value > thresh).length / r.length));
  },

  iq(prob) {
    const p = Math.max(0.05, Math.min(0.95, prob));
    return this.B * Math.log(p / (1 - p));
  },

  // ── Market Generation ─────────────────────────────
  genMarkets() {
    const open = this.markets.filter(m => m.status === 'open');
    const ids = new Set(open.map(m => m.id));
    const add = [];

    for (const [iid, inst] of Object.entries(this.INST)) {
      const data = this.hist(iid);
      const last = this.latest(iid);
      if (!last) continue;
      const v = last.value;
      const r = inst.round;

      if (iid === 'epu_daily' || iid === 'emv_daily') {
        const base = Math.round(v / r) * r;
        [base - r, base, base + r].filter(t => t > 0).forEach(t => {
          const id = `${iid}_above_${t}_${this.nextBD()}`;
          if (!ids.has(id)) {
            const prob = this.hProb(data, t);
            add.push({ id, inst: iid, cat: 'daily', type: 'above', threshold: t,
              title: `${inst.short} above ${t}`, question: `Will ${inst.name} close above ${t}?`,
              settle: this.nextBD(), refVal: v, qy: this.iq(prob), qn: 0, vol: 0,
              status: 'open', outcome: null, settleVal: null });
          }
        });
        const wid = `${iid}_rises_${this.endWeek()}`;
        if (!ids.has(wid)) {
          add.push({ id: wid, inst: iid, cat: 'weekly', type: 'direction', threshold: null,
            title: `${inst.short} rises this week`, question: `Will ${inst.name} increase by end of week?`,
            settle: this.endWeek(), refVal: v, qy: 0, qn: 0, vol: 0,
            status: 'open', outcome: null, settleVal: null });
        }
      }

      if (iid === 'epu_monthly') {
        const base = Math.round(v / r) * r;
        const mid = `${iid}_above_${base}_${this.endMonth()}`;
        if (!ids.has(mid)) {
          add.push({ id: mid, inst: iid, cat: 'monthly', type: 'above', threshold: base,
            title: `${inst.short} above ${base}`, question: `Will ${inst.name} close above ${base} this month?`,
            settle: this.endMonth(), refVal: v, qy: this.iq(this.hProb(data, base)), qn: 0, vol: 0,
            status: 'open', outcome: null, settleVal: null });
        }
        const drid = `${iid}_rises_${this.endMonth()}`;
        if (!ids.has(drid)) {
          add.push({ id: drid, inst: iid, cat: 'monthly', type: 'direction', threshold: null,
            title: `${inst.short} rises this month`, question: `Will ${inst.name} increase this month?`,
            settle: this.endMonth(), refVal: v, qy: 0, qn: 0, vol: 0,
            status: 'open', outcome: null, settleVal: null });
        }
      }

      if (iid === 'wui_global') {
        const base = Math.round(v / r) * r;
        const qid = `${iid}_above_${base}_${this.endQtr()}`;
        if (!ids.has(qid)) {
          add.push({ id: qid, inst: iid, cat: 'quarterly', type: 'above', threshold: base,
            title: `${inst.short} above ${base.toLocaleString()}`,
            question: `Will the ${inst.name} exceed ${base.toLocaleString()} this quarter?`,
            settle: this.endQtr(), refVal: v, qy: this.iq(this.hProb(data, base)), qn: 0, vol: 0,
            status: 'open', outcome: null, settleVal: null });
        }
        const drid = `${iid}_rises_${this.endQtr()}`;
        if (!ids.has(drid)) {
          add.push({ id: drid, inst: iid, cat: 'quarterly', type: 'direction', threshold: null,
            title: `${inst.short} rises this quarter`, question: `Will the ${inst.name} increase this quarter?`,
            settle: this.endQtr(), refVal: v, qy: 0, qn: 0, vol: 0,
            status: 'open', outcome: null, settleVal: null });
        }
      }
    }

    const today = new Date().toISOString().split('T')[0];
    this.markets = [...open.filter(m => {
      if (m.settle < today && !this.portfolio.positions.some(p => p.marketId === m.id)) return false;
      return true;
    }), ...add];
    this.saveM();
  },

  // ── Settlement ────────────────────────────────────
  settle() {
    let any = false;
    for (const m of this.markets.filter(m => m.status === 'open')) {
      const data = this.hist(m.inst);
      if (!data.length) continue;
      const sp = data.find(d => d.date >= m.settle);
      if (!sp) continue;

      const outcome = m.type === 'above'
        ? (sp.value > m.threshold ? 'yes' : 'no')
        : (sp.value > m.refVal ? 'yes' : 'no');

      m.status = 'settled'; m.outcome = outcome; m.settleVal = sp.value;

      for (const pos of this.portfolio.positions.filter(p => p.marketId === m.id)) {
        const won = pos.side === outcome;
        const payout = won ? pos.shares : 0;
        this.portfolio.balance += payout;
        this.portfolio.history.push({
          id: 'h_' + Date.now() + Math.random().toString(36).slice(2, 6),
          marketId: m.id, title: m.title, side: pos.side, shares: pos.shares,
          cost: pos.cost, payout, profit: payout - pos.cost, outcome,
          settledAt: new Date().toISOString()
        });
      }
      this.portfolio.positions = this.portfolio.positions.filter(p => p.marketId !== m.id);
      any = true;
    }
    if (any) { this.saveM(); this.saveP(); }
  },

  // ── Trading ───────────────────────────────────────
  buy(mktId, s, n) {
    const m = this.markets.find(m => m.id === mktId);
    if (!m || m.status !== 'open' || n < 1) return;
    const cost = this.buyCost(m, s, n);
    if (cost > this.portfolio.balance + 0.001) { this.toast('Insufficient balance'); return; }

    if (s === 'yes') m.qy += n; else m.qn += n;
    m.vol += n;
    this.portfolio.balance -= cost;

    const ex = this.portfolio.positions.find(p => p.marketId === mktId && p.side === s);
    if (ex) { ex.shares += n; ex.cost += cost; ex.avgPrice = ex.cost / ex.shares; }
    else {
      this.portfolio.positions.push({
        id: 'p_' + Date.now(), marketId: mktId, side: s, shares: n,
        cost, avgPrice: cost / n, ts: new Date().toISOString()
      });
    }
    this.saveM(); this.saveP(); this.render();
    this.toast(`Bought ${n} ${s.toUpperCase()} @ ${(cost / n * 100).toFixed(0)}¢`);
  },

  sellPos(idx) {
    const pos = this.portfolio.positions[idx];
    if (!pos) return;
    const m = this.markets.find(m => m.id === pos.marketId);
    if (!m || m.status !== 'open') return;

    const proceeds = this.sellProc(m, pos.side, pos.shares);
    if (pos.side === 'yes') m.qy -= pos.shares; else m.qn -= pos.shares;
    m.vol += pos.shares;
    this.portfolio.balance += proceeds;
    const pnl = proceeds - pos.cost;
    this.portfolio.positions.splice(idx, 1);
    this.saveM(); this.saveP(); this.render();
    this.toast(`Sold — ${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)}`);
  },

  totalVal() {
    let v = this.portfolio.balance;
    for (const pos of this.portfolio.positions) {
      const m = this.markets.find(m => m.id === pos.marketId);
      if (!m) continue;
      v += pos.shares * this.P(m.qy, m.qn, pos.side);
    }
    return v;
  },

  // ── Storage ───────────────────────────────────────
  saveM() { try { localStorage.setItem(this.SK_M, JSON.stringify(this.markets)); } catch (_) {} },
  loadM() { try { this.markets = JSON.parse(localStorage.getItem(this.SK_M) || '[]'); } catch (_) { this.markets = []; } },
  saveP() { try { localStorage.setItem(this.SK_P, JSON.stringify(this.portfolio)); } catch (_) {} },
  loadP() {
    try { this.portfolio = JSON.parse(localStorage.getItem(this.SK_P) || 'null') || { balance: this.INIT_BAL, positions: [], history: [] }; }
    catch (_) { this.portfolio = { balance: this.INIT_BAL, positions: [], history: [] }; }
  },

  // ── Rendering ─────────────────────────────────────
  renderHeader() {
    const b = document.getElementById('pm-balance');
    const v = document.getElementById('pm-value');
    if (b) b.textContent = '$' + this.portfolio.balance.toFixed(2);
    if (v) v.textContent = '$' + this.totalVal().toFixed(2);
  },

  renderMarkets() {
    const el = document.getElementById('pm-markets');
    if (!el) return;
    const list = this.markets.filter(m => m.status === 'open' && (this.filter === 'all' || m.cat === this.filter));

    if (!list.length) {
      el.innerHTML = '<div class="pm-empty-list">No markets available yet &mdash; waiting for data.</div>';
      return;
    }

    el.innerHTML = list.map(m => {
      const py = this.P(m.qy, m.qn, 'yes');
      const pn = 1 - py;
      const sel = m.id === this.sel ? ' pm-card-sel' : '';
      return `<div class="pm-card${sel}" onclick="TRADE.selectMarket('${m.id}')">
        <div class="pm-card-top"><span class="pm-cat-pill">${m.cat.toUpperCase()}</span><span class="pm-card-exp">${this.daysLeft(m.settle)}</span></div>
        <div class="pm-card-q">${m.title}</div>
        <div class="pm-card-bar"><div class="pm-bar-fill" style="width:${(py * 100).toFixed(1)}%"></div></div>
        <div class="pm-card-prices"><span class="pm-c-yes">YES ${(py * 100).toFixed(0)}¢</span><span class="pm-c-no">NO ${(pn * 100).toFixed(0)}¢</span></div>
        <div class="pm-card-foot"><span>${this.INST[m.inst]?.fred || ''}</span><span>${m.vol} traded</span></div>
      </div>`;
    }).join('');
  },

  renderDetail() {
    const el = document.getElementById('pm-detail');
    if (!el) return;

    if (!this.sel) {
      el.innerHTML = `<div class="pm-detail-empty"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(99,102,241,.3)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2"/></svg><div>Select a market to start trading</div></div>`;
      return;
    }

    const m = this.markets.find(x => x.id === this.sel);
    if (!m) { this.sel = null; this.renderDetail(); return; }

    const py = this.P(m.qy, m.qn, 'yes');
    const pn = 1 - py;
    const inst = this.INST[m.inst];
    const last = this.latest(m.inst);
    const curVal = last ? (last.value > 1000 ? last.value.toLocaleString() : last.value.toFixed(1)) : '—';
    const shares = 10;
    const cost = this.buyCost(m, this.side, shares);
    const avgP = cost / shares;
    const profit = shares - cost;
    const roi = cost > 0 ? (profit / cost * 100) : 0;

    el.innerHTML = `<div class="pm-det-card">
      <div class="pm-det-q">${m.question}</div>
      <div class="pm-det-meta-row">
        <div class="pm-det-chip"><span class="pm-det-label">Settles</span>${this.fmtDate(m.settle)}</div>
        <div class="pm-det-chip"><span class="pm-det-label">Source</span><a href="https://fred.stlouisfed.org/series/${inst?.fred}" target="_blank">${inst?.fred}</a></div>
        <div class="pm-det-chip"><span class="pm-det-label">Current</span>${curVal}</div>
        <div class="pm-det-chip"><span class="pm-det-label">Volume</span>${m.vol}</div>
      </div>

      <div class="pm-prob-wrap">
        <div class="pm-prob-bar">
          <div class="pm-pbar-yes" style="width:${Math.max(py * 100, 8).toFixed(1)}%"><span>YES ${(py * 100).toFixed(0)}¢</span></div>
          <div class="pm-pbar-no"><span>NO ${(pn * 100).toFixed(0)}¢</span></div>
        </div>
      </div>

      <div class="pm-chart-box"><div id="pmChart"></div></div>

      <div class="pm-order-box">
        <div class="pm-sides">
          <button class="pm-side pm-s-yes${this.side === 'yes' ? ' on' : ''}" onclick="TRADE.setSide('yes')">Buy YES</button>
          <button class="pm-side pm-s-no${this.side === 'no' ? ' on' : ''}" onclick="TRADE.setSide('no')">Buy NO</button>
        </div>
        <div class="pm-field"><label class="pm-lbl">Shares</label><input type="number" id="pm-shares" class="pm-input" value="10" min="1" max="500" oninput="TRADE.updatePreview()"></div>
        <div class="pm-preview" id="pm-preview">
          <div class="pm-pv-row"><span>Avg Price</span><strong>${(avgP * 100).toFixed(1)}¢</strong></div>
          <div class="pm-pv-row"><span>Total Cost</span><strong>$${cost.toFixed(2)}</strong></div>
          <div class="pm-pv-row"><span>Payout if ${this.side.toUpperCase()}</span><strong>$${shares.toFixed(2)}</strong></div>
          <div class="pm-pv-row ${profit >= 0 ? 'pm-pv-profit' : 'pm-pv-loss'}"><span>Potential Profit</span><strong>${profit >= 0 ? '+' : ''}$${profit.toFixed(2)} (${roi.toFixed(0)}%)</strong></div>
        </div>
        <button class="pm-exec ${this.side === 'yes' ? 'pm-exec-yes' : 'pm-exec-no'}" id="pm-exec" onclick="TRADE.executeBuy()">Buy ${this.side.toUpperCase()} &mdash; $${cost.toFixed(2)}</button>
      </div>

      ${m.threshold ? `<div class="pm-info-box"><div class="pm-info-r"><span>Threshold</span><span>${m.threshold.toLocaleString()}</span></div><div class="pm-info-r"><span>Reference</span><span>${m.refVal > 1000 ? m.refVal.toLocaleString() : m.refVal?.toFixed(1)}</span></div><div class="pm-info-r"><span>Instrument</span><span>${inst?.name}</span></div></div>` : `<div class="pm-info-box"><div class="pm-info-r"><span>Reference Value</span><span>${m.refVal > 1000 ? m.refVal.toLocaleString() : m.refVal?.toFixed(1)}</span></div><div class="pm-info-r"><span>Instrument</span><span>${inst?.name}</span></div></div>`}
    </div>`;

    this.renderMiniChart(m);
  },

  renderMiniChart(m) {
    const el = document.getElementById('pmChart');
    if (!el) return;
    const data = this.hist(m.inst);
    if (!data.length) { el.style.height = '0'; return; }

    el.style.height = '220px';
    const sliceN = (m.cat === 'daily' || m.cat === 'weekly') ? 90 : m.cat === 'monthly' ? 36 : data.length;
    const cd = data.slice(-sliceN).map(d => ({ time: d.date, value: d.value }));

    if (this.chart) { try { this.chart.remove(); } catch (_) {} this.chart = null; this.series = null; }

    this.chart = LightweightCharts.createChart(el, {
      width: el.clientWidth, height: 220,
      layout: { background: { type: 'solid', color: 'transparent' }, textColor: '#52526e', fontFamily: 'Inter', fontSize: 10 },
      grid: { vertLines: { color: 'rgba(255,255,255,0.02)' }, horzLines: { color: 'rgba(255,255,255,0.02)' } },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: .08, bottom: .08 } },
      timeScale: { borderVisible: false, fixLeftEdge: true },
      crosshair: { mode: LightweightCharts.CrosshairMode.Normal,
        vertLine: { color: 'rgba(99,102,241,.2)', width: 1, style: 2, labelBackgroundColor: '#6366f1' },
        horzLine: { color: 'rgba(99,102,241,.2)', width: 1, style: 2, labelBackgroundColor: '#6366f1' } },
      handleScroll: true, handleScale: true
    });

    this.series = this.chart.addAreaSeries({
      topColor: 'rgba(99,102,241,.2)', bottomColor: 'rgba(99,102,241,0)',
      lineColor: '#818cf8', lineWidth: 2, lastValueVisible: true,
      crosshairMarkerVisible: true, crosshairMarkerRadius: 3,
      crosshairMarkerBorderColor: '#fff', crosshairMarkerBackgroundColor: '#6366f1'
    });
    this.series.setData(cd);

    if (m.threshold) {
      this.series.createPriceLine({
        price: m.threshold, color: 'rgba(234,179,8,.6)', lineWidth: 1, lineStyle: 2,
        axisLabelVisible: true, title: 'Target'
      });
    }

    this.chart.timeScale().fitContent();
    const ro = new ResizeObserver(() => { if (this.chart) this.chart.applyOptions({ width: el.clientWidth }); });
    ro.observe(el);
  },

  updatePreview() {
    const m = this.markets.find(x => x.id === this.sel);
    if (!m) return;
    const n = parseInt(document.getElementById('pm-shares')?.value) || 10;
    const cost = this.buyCost(m, this.side, n);
    const avgP = cost / n;
    const profit = n - cost;
    const roi = cost > 0 ? (profit / cost * 100) : 0;

    const pv = document.getElementById('pm-preview');
    if (pv) pv.innerHTML = `
      <div class="pm-pv-row"><span>Avg Price</span><strong>${(avgP * 100).toFixed(1)}¢</strong></div>
      <div class="pm-pv-row"><span>Total Cost</span><strong>$${cost.toFixed(2)}</strong></div>
      <div class="pm-pv-row"><span>Payout if ${this.side.toUpperCase()}</span><strong>$${n.toFixed(2)}</strong></div>
      <div class="pm-pv-row ${profit >= 0 ? 'pm-pv-profit' : 'pm-pv-loss'}"><span>Potential Profit</span><strong>${profit >= 0 ? '+' : ''}$${profit.toFixed(2)} (${roi.toFixed(0)}%)</strong></div>`;

    const btn = document.getElementById('pm-exec');
    if (btn) {
      btn.textContent = `Buy ${this.side.toUpperCase()} — $${cost.toFixed(2)}`;
      btn.className = `pm-exec ${this.side === 'yes' ? 'pm-exec-yes' : 'pm-exec-no'}`;
    }
  },

  renderPositions() {
    const el = document.getElementById('pm-positions');
    const ct = document.getElementById('pm-pos-count');
    if (!el) return;
    const ps = this.portfolio.positions;
    if (ct) ct.textContent = `${ps.length} active`;

    if (!ps.length) { el.innerHTML = '<div class="pm-empty-sec">No active positions</div>'; return; }

    el.innerHTML = ps.map((pos, idx) => {
      const m = this.markets.find(x => x.id === pos.marketId);
      if (!m) return '';
      const cp = this.P(m.qy, m.qn, pos.side);
      const cv = pos.shares * cp;
      const upnl = cv - pos.cost;
      const pot = pos.shares - pos.cost;
      return `<div class="pm-pos-card">
        <div class="pm-pos-top"><span class="pm-pos-badge pm-badge-${pos.side}">${pos.side.toUpperCase()}</span><span class="pm-pos-name">${m.title}</span><span class="pm-pos-shares">${pos.shares} @ ${(pos.avgPrice * 100).toFixed(0)}¢</span></div>
        <div class="pm-pos-grid">
          <div><div class="pm-pos-lbl">Current</div><div>${(cp * 100).toFixed(0)}¢</div></div>
          <div><div class="pm-pos-lbl">Value</div><div>$${cv.toFixed(2)}</div></div>
          <div class="${upnl >= 0 ? 'pm-pv-profit' : 'pm-pv-loss'}"><div class="pm-pos-lbl">P&L</div><div><strong>${upnl >= 0 ? '+' : ''}$${upnl.toFixed(2)}</strong></div></div>
          <div><div class="pm-pos-lbl">If wins</div><div>+$${pot.toFixed(2)}</div></div>
        </div>
        <button class="pm-sell-btn" onclick="TRADE.sellPos(${idx})">Sell ${pos.shares} shares &mdash; ~$${cv.toFixed(2)}</button>
      </div>`;
    }).join('');
  },

  renderHistory() {
    const el = document.getElementById('pm-history');
    const ct = document.getElementById('pm-hist-count');
    if (!el) return;
    const h = this.portfolio.history.slice().reverse();
    if (ct) {
      const net = h.reduce((s, x) => s + x.profit, 0);
      const wins = h.filter(x => x.profit > 0).length;
      ct.textContent = `${h.length} settled · Net: ${net >= 0 ? '+' : ''}$${net.toFixed(2)} · Win rate: ${h.length ? ((wins / h.length) * 100).toFixed(0) : 0}%`;
    }
    if (!h.length) { el.innerHTML = '<div class="pm-empty-sec">No settlements yet</div>'; return; }

    el.innerHTML = h.slice(0, 30).map(x => {
      const won = x.profit > 0;
      return `<div class="pm-hist-row ${won ? 'pm-hist-w' : 'pm-hist-l'}">
        <span class="pm-pos-badge pm-badge-${x.side}">${x.side.toUpperCase()}</span>
        <span class="pm-hist-title">${x.title}</span>
        <span class="pm-hist-detail">${x.shares} sh · $${x.cost.toFixed(2)} → $${x.payout.toFixed(2)}</span>
        <span class="${won ? 'pm-pv-profit' : 'pm-pv-loss'}"><strong>${x.profit >= 0 ? '+' : ''}$${x.profit.toFixed(2)}</strong></span>
      </div>`;
    }).join('');
  },

  render() {
    if (!this.ready) return;
    if (this.sel && !this.markets.find(m => m.id === this.sel && m.status === 'open')) this.sel = null;
    this.renderHeader();
    this.renderMarkets();
    this.renderDetail();
    this.renderPositions();
    this.renderHistory();
  },

  // ── Actions ───────────────────────────────────────
  selectMarket(id) {
    this.sel = id;
    this.side = 'yes';
    if (this.chart) { try { this.chart.remove(); } catch (_) {} this.chart = null; this.series = null; }
    this.render();
  },

  setSide(s) {
    this.side = s;
    document.querySelectorAll('.pm-side').forEach(b => b.classList.remove('on'));
    document.querySelector(s === 'yes' ? '.pm-s-yes' : '.pm-s-no')?.classList.add('on');
    this.updatePreview();
  },

  executeBuy() {
    if (!this.sel) return;
    const n = parseInt(document.getElementById('pm-shares')?.value) || 10;
    this.buy(this.sel, this.side, n);
  },

  setFilter(cat) {
    this.filter = cat;
    document.querySelectorAll('.pm-fil').forEach(b => b.classList.toggle('on', b.dataset.cat === cat));
    this.renderMarkets();
  },

  reset() {
    if (!confirm('Reset account? Balance → $1,000. All positions and history cleared.')) return;
    this.portfolio = { balance: this.INIT_BAL, positions: [], history: [] };
    this.markets = [];
    this.sel = null;
    if (this.chart) { try { this.chart.remove(); } catch (_) {} this.chart = null; this.series = null; }
    this.saveP(); this.saveM();
    this.genMarkets();
    this.render();
    this.toast('Account reset to $1,000');
  },

  toast(msg) {
    let t = document.getElementById('tradeToast');
    if (!t) { t = document.createElement('div'); t.id = 'tradeToast'; t.className = 'ca-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
  },

  // ── Lifecycle ─────────────────────────────────────
  init() {
    this.loadM(); this.loadP();
    this.genMarkets(); this.settle();
    this.ready = true;
    this.render();
  },

  refresh() {
    if (!this.ready) return;
    this.settle(); this.genMarkets(); this.render();
  }
};
