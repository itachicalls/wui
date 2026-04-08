/* ═══════════════════════════════════════════════════
   $WUI Token — Solana SPL Token Tab
   Wallet connection, live chart, in-app swap via Jupiter
   ═══════════════════════════════════════════════════ */

const TOKEN = {
  CA: 'FfPryhuC6Bahn6agpLe2X1gaibsPpZbR1gn49KW7pump',
  wallet: null,
  provider: null,
  chartLoaded: false,
  jupLoaded: false,
  jupReady: false,

  // ── Wallet ────────────────────────────────────────
  getProvider() {
    if (window?.phantom?.solana?.isPhantom) return window.phantom.solana;
    if (window?.solflare?.isSolflare) return window.solflare;
    if (window?.backpack) return window.backpack;
    return null;
  },

  async connectWallet() {
    const p = this.getProvider();
    if (!p) {
      window.open('https://phantom.app/', '_blank');
      return;
    }
    try {
      const resp = await p.connect();
      this.wallet = resp.publicKey.toString();
      this.provider = p;
      this.updateBtn();
    } catch (e) { console.warn('Wallet:', e); }
  },

  async disconnectWallet() {
    if (this.provider) try { await this.provider.disconnect(); } catch (_) {}
    this.wallet = null;
    this.provider = null;
    this.updateBtn();
  },

  updateBtn() {
    const btn = document.getElementById('tk-wallet-btn');
    if (!btn) return;
    if (this.wallet) {
      const s = this.wallet.slice(0, 4) + '…' + this.wallet.slice(-4);
      btn.innerHTML = '<span class="tk-wdot"></span>' + s;
      btn.className = 'tk-wallet-btn tk-connected';
    } else {
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M16 12h.01"/><path d="M2 10h20"/></svg> Connect Wallet';
      btn.className = 'tk-wallet-btn';
    }
  },

  handleWalletClick() {
    if (this.wallet) this.disconnectWallet();
    else this.connectWallet();
  },

  // ── Chart ─────────────────────────────────────────
  loadChart() {
    if (this.chartLoaded) return;
    this.chartLoaded = true;
    const iframe = document.getElementById('tk-chart');
    if (iframe && !iframe.src) {
      iframe.src = 'https://dexscreener.com/solana/' + this.CA + '?embed=1&theme=dark&trades=0&info=0';
    }
  },

  // ── Jupiter Terminal ──────────────────────────────
  loadJupiter() {
    if (this.jupLoaded) return;
    this.jupLoaded = true;
    const el = document.getElementById('jupiter-terminal');
    if (!el) return;

    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:120px;color:var(--txm);font-size:.78rem"><div style="width:20px;height:20px;border:2px solid rgba(255,255,255,.06);border-top-color:#6366f1;border-radius:50%;animation:spin .6s linear infinite;margin-right:10px"></div>Loading swap...</div>';

    const s = document.createElement('script');
    s.src = 'https://terminal.jup.ag/main-v2.js';
    s.onload = () => {
      setTimeout(() => {
        if (window.Jupiter) {
          try {
            window.Jupiter.init({
              displayMode: 'integrated',
              integratedTargetId: 'jupiter-terminal',
              endpoint: 'https://api.mainnet-beta.solana.com',
              strictTokenList: false,
              defaultExplorer: 'Solscan',
              formProps: {
                initialOutputMint: this.CA,
                initialInputMint: 'So11111111111111111111111111111111111111112',
                fixedOutputMint: false,
              }
            });
            this.jupReady = true;
          } catch (e) {
            console.warn('Jupiter init:', e);
            el.innerHTML = '';
          }
        } else {
          el.innerHTML = '';
        }
      }, 800);
    };
    s.onerror = () => {
      console.warn('Jupiter Terminal unavailable');
      el.innerHTML = '';
    };
    document.head.appendChild(s);
  },

  // ── Copy ──────────────────────────────────────────
  copyCA() {
    navigator.clipboard.writeText(this.CA).then(() => {
      const t = document.getElementById('caToast');
      if (t) { t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1800); }
    }).catch(() => {});
  },

  // ── Lifecycle ─────────────────────────────────────
  init() {
    this.loadChart();
    this.loadJupiter();
    const p = this.getProvider();
    if (p?.isConnected && p.publicKey) {
      this.wallet = p.publicKey.toString();
      this.provider = p;
      this.updateBtn();
    }
  }
};
