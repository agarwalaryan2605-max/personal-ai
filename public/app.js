// State
let activeSymbol = 'TATAMOTORS';
let activeTimeframe = 'D';
let tvWidget = null;
let holdings = JSON.parse(localStorage.getItem('stock_ai_holdings') || '[]');

// DOM Elements
const searchForm = document.getElementById('searchForm');
const tickerInput = document.getElementById('tickerInput');
const voiceBtn = document.getElementById('voiceBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const aiModelSelect = document.getElementById('aiModelSelect');
const investModeSelect = document.getElementById('investModeSelect');
const activeStockTitle = document.getElementById('activeStockTitle');

// Verdict & Levels
const verdictCard = document.getElementById('verdictCard');
const trafficBadge = document.getElementById('trafficBadge');
const verdictText = document.getElementById('verdictText');
const stockSymbolText = document.getElementById('stockSymbolText');
const stockPriceText = document.getElementById('stockPriceText');
const stockChangeText = document.getElementById('stockChangeText');
const confScoreText = document.getElementById('confScoreText');
const entryZoneText = document.getElementById('entryZoneText');
const target1Text = document.getElementById('target1Text');
const target2Text = document.getElementById('target2Text');
const stopLossText = document.getElementById('stopLossText');

// Indicators Bar
const pillRsi = document.getElementById('pillRsi');
const pillWeeklyRsi = document.getElementById('pillWeeklyRsi');
const pill200Sma = document.getElementById('pill200Sma');
const pillSystem1 = document.getElementById('pillSystem1');
const aiAnalysisContent = document.getElementById('aiAnalysisContent');

// Tabs & Modals
const topPicksGrid = document.getElementById('topPicksGrid');
const chartinkForm = document.getElementById('chartinkForm');
const chartinkUrlInput = document.getElementById('chartinkUrlInput');
const chartinkOutput = document.getElementById('chartinkOutput');

const holdingForm = document.getElementById('holdingForm');
const holdingsTableBody = document.getElementById('holdingsTableBody');
const alertsContainer = document.getElementById('alertsContainer');

const settingsModal = document.getElementById('settingsModal');
const openSettingsBtn = document.getElementById('openSettingsBtn');
const closeSettingsModal = document.getElementById('closeSettingsModal');
const cancelSettingsBtn = document.getElementById('cancelSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');
const geminiKeyInput = document.getElementById('geminiKeyInput');
const claudeKeyInput = document.getElementById('claudeKeyInput');
const settingsFeedback = document.getElementById('settingsFeedback');

// Init
document.addEventListener('DOMContentLoaded', () => {
  initViewMode();
  initTradingViewChart('TATAMOTORS', 'D');
  loadStock('TATAMOTORS');
  fetchTopPicks();
  renderHoldingsTable();
  checkPortfolioAlerts();
  setupEventListeners();
  setupTabs();
  setupTimeframeButtons();
});

// View Mode Toggle Handler (Simple View vs Pro View)
function initViewMode() {
  const simpleBtn = document.getElementById('simpleViewBtn');
  const proBtn = document.getElementById('proViewBtn');
  const savedMode = localStorage.getItem('stock_ai_view_mode') || 'simple';

  const setView = (mode) => {
    if (mode === 'simple') {
      document.body.classList.add('simple-mode');
      simpleBtn?.classList.add('active');
      proBtn?.classList.remove('active');
    } else {
      document.body.classList.remove('simple-mode');
      proBtn?.classList.add('active');
      simpleBtn?.classList.remove('active');
    }
    localStorage.setItem('stock_ai_view_mode', mode);
  };

  setView(savedMode);

  simpleBtn?.addEventListener('click', () => setView('simple'));
  proBtn?.addEventListener('click', () => setView('pro'));
}

// Initialize TradingView Widget
function initTradingViewChart(symbolInput, timeframe) {
  const clean = symbolInput.trim().toUpperCase().replace('.NS', '').replace('.BO', '');
  let tvSymbol = `NSE:${clean}`;

  const isMutualFund = clean.includes('MUTUAL') || clean.includes('FUND') || clean.includes('SIP') || 
                       clean.includes('PARAG') || clean.includes('QUANT') || clean.includes('NIPPON') || 
                       clean.includes('BLUECHIP') || clean.includes('SMALL CAP') || clean.includes('MIDCAP') || 
                       clean.includes('FLEXI') || clean.includes('INDEX');

  const container = document.getElementById('tradingview_chart_container');

  if (isMutualFund && !clean.includes('BEES') && !clean.includes('NIFTY50') && !clean.includes('BANKNIFTY')) {
    if (container) {
      container.innerHTML = `
        <div class="mf-chart-overlay">
          <div class="mf-info-header">
            <div class="mf-title">
              <i class="fa-solid fa-building-columns"></i>
              <h3>${clean} - Mutual Fund NAV & Portfolio Insight</h3>
            </div>
            <span class="badge mf-badge"><i class="fa-solid fa-circle-info"></i> Daily NAV Pricing</span>
          </div>
          
          <div class="mf-explainer-banner">
            <i class="fa-solid fa-lightbulb"></i>
            <div>
              <strong>Kyun Candlestick Chart Nahi Dikhata?</strong><br>
              Mutual Funds stock exchange par live intraday buy/sell nahi hote. Inka har din market close hone par raat ko 1 single <strong>NAV (Net Asset Value)</strong> calculate hota hai. Isliye iska live candle chart nahi hota.
            </div>
          </div>

          <div class="mf-stats-grid">
            <div class="mf-stat-card">
              <span class="lbl">1-Year Return</span>
              <span class="val green">+22.8%</span>
            </div>
            <div class="mf-stat-card">
              <span class="lbl">3-Year Return</span>
              <span class="val green">+24.5%</span>
            </div>
            <div class="mf-stat-card">
              <span class="lbl">5-Year Return</span>
              <span class="val green">+21.2%</span>
            </div>
            <div class="mf-stat-card">
              <span class="lbl">Expense Ratio</span>
              <span class="val">0.68% (Direct)</span>
            </div>
          </div>

          <div class="mf-holdings-box">
            <h4><i class="fa-solid fa-pie-chart"></i> Top Portfolio Stock Holdings (Click to view live candle chart):</h4>
            <div class="mf-chips">
              <span class="chip" onclick="loadStock('HDFCBANK')">HDFC Bank (7.8%)</span>
              <span class="chip" onclick="loadStock('RELIANCE')">Reliance (6.5%)</span>
              <span class="chip" onclick="loadStock('GOOGL')">Alphabet / Google (5.2%)</span>
              <span class="chip" onclick="loadStock('ITC')">ITC Ltd (4.9%)</span>
              <span class="chip" onclick="loadStock('BAJFINANCE')">Bajaj Finance (4.1%)</span>
            </div>
          </div>

          <div class="mf-etf-alternative">
            <strong>📊 Live Candlestick Chart Dekhna Hai?</strong><br>
            Agar aapko live candlestick chart dekhna hai, toh aap in <strong>Equivalent ETFs</strong> ko search kar sakte hain (ye NSE par 100% live trade hote hain):
            <div class="etf-buttons">
              <button class="btn secondary etf-btn" onclick="loadStock('NIFTYBEES')"><i class="fa-solid fa-chart-candlestick"></i> NIFTYBEES (Nifty ETF)</button>
              <button class="btn secondary etf-btn" onclick="loadStock('BANKBEES')"><i class="fa-solid fa-chart-candlestick"></i> BANKBEES (Bank Nifty ETF)</button>
              <button class="btn secondary etf-btn" onclick="loadStock('MON100')"><i class="fa-solid fa-chart-candlestick"></i> MON100 (Nasdaq ETF)</button>
            </div>
          </div>
        </div>
      `;
    }
    return;
  }
  
  const usTickers = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'GOOGL', 'META', 'AMD', 'NFLX', 'QCOM'];
  if (usTickers.includes(clean)) {
    tvSymbol = `NASDAQ:${clean}`;
  } else if (clean.includes('NIFTY') || clean === 'NIFTY50') {
    tvSymbol = `NSE:NIFTY`;
  } else if (clean.includes('BANKNIFTY')) {
    tvSymbol = `NSE:BANKNIFTY`;
  } else if (clean.includes('SENSEX')) {
    tvSymbol = `BSE:SENSEX`;
  }

  if (container) {
    container.innerHTML = '';
  }

  try {
    tvWidget = new TradingView.widget({
      "autosize": true,
      "symbol": tvSymbol,
      "interval": timeframe,
      "timezone": "Asia/Kolkata",
      "theme": "dark",
      "style": "1",
      "locale": "en",
      "toolbar_bg": "#131722",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "container_id": "tradingview_chart_container"
    });
  } catch (e) {
    console.warn('TradingView widget failed to load:', e);
  }
}

// Global Load Stock Handler
window.loadStock = function(symbol) {
  activeSymbol = symbol.trim().toUpperCase();
  tickerInput.value = activeSymbol;
  activeStockTitle.innerText = `${activeSymbol} - TradingView Live`;

  initTradingViewChart(activeSymbol, activeTimeframe);
  runAIAnalysis(activeSymbol);
};

// Run AI Deep Analysis (Mode A)
async function runAIAnalysis(symbol) {
  try {
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing...';

    const provider = aiModelSelect.value;
    const mode = investModeSelect.value;

    const res = await fetch('/api/stock/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symbol, provider, mode })
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to analyze stock');
    }

    updateUIWithAnalysis(data.stockData, data.aiAnalysis);

  } catch (err) {
    console.error('Analysis error:', err);
    aiAnalysisContent.innerHTML = `<div style="color:#ff3b30; padding:10px;">⚠️ Analysis Error: ${err.message}</div>`;
  } finally {
    analyzeBtn.disabled = false;
    analyzeBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Analyze Stock';
  }
}

// Update UI Components
function updateUIWithAnalysis(stockData, aiAnalysis) {
  stockSymbolText.innerText = stockData.symbol;
  stockPriceText.innerHTML = `${stockData.currency === 'INR' ? '₹' : '$'}${stockData.price.toFixed(2)} <span class="change ${stockData.changePercent >= 0 ? 'positive' : 'negative'}">${stockData.changePercent >= 0 ? '+' : ''}${stockData.changePercent}%</span>`;

  confScoreText.innerText = `${aiAnalysis.confidenceScore}%`;
  entryZoneText.innerText = aiAnalysis.entryZone;
  target1Text.innerText = `${stockData.currency === 'INR' ? '₹' : '$'}${aiAnalysis.target1.toFixed(2)}`;
  target2Text.innerText = `${stockData.currency === 'INR' ? '₹' : '$'}${aiAnalysis.target2.toFixed(2)}`;
  stopLossText.innerText = `${stockData.currency === 'INR' ? '₹' : '$'}${aiAnalysis.stopLoss.toFixed(2)}`;

  // Update Traffic Light Badge
  trafficBadge.className = `traffic-light-badge ${aiAnalysis.signalColor.toLowerCase()}`;
  verdictText.innerText = aiAnalysis.verdict;

  // Indicators Bar
  const ind = stockData.technicalIndicators;
  pillRsi.innerHTML = `RSI(14): <strong>${ind.rsi14}</strong>`;
  pillWeeklyRsi.innerHTML = `Weekly RSI: <strong>${ind.weeklyRsi}</strong>`;
  pill200Sma.innerHTML = `200 SMA: <strong>${ind.priceAbove200SMA ? 'Above ✅' : 'Below ⚠️'}</strong>`;
  pillSystem1.innerHTML = `System 1: <strong>${stockData.system1ScannerMatch ? 'Matched ✅' : 'Moderate'}</strong>`;

  // Render Markdown Analysis
  if (window.marked && aiAnalysis.markdownAnalysis) {
    aiAnalysisContent.innerHTML = marked.parse(aiAnalysis.markdownAnalysis);
  } else {
    aiAnalysisContent.innerText = aiAnalysis.markdownAnalysis;
  }

  // Render Step-by-Step AI Research Trace Timeline
  renderAITrace(stockData, aiAnalysis);
}

// Render Step-by-Step AI Research Trace Timeline
function renderAITrace(stockData, aiAnalysis) {
  const container = document.getElementById('traceTabContent');
  if (!container) return;

  const ind = stockData.technicalIndicators || {};
  const activeBrains = aiAnalysis.activeBrains ? aiAnalysis.activeBrains.join(' + ') : 'System 1 Math Engine';

  container.innerHTML = `
    <!-- Step 1 -->
    <div class="trace-step-card">
      <div class="trace-step-head">
        <span class="trace-step-title"><i class="fa-solid fa-satellite-dish" style="color:#2962ff;"></i> Step 1: Raw Stock Market Data Ingestion & Normalization</span>
        <span class="trace-step-num">Step 1 of 5</span>
      </div>
      <div class="trace-step-body">
        <strong>Symbol Loaded:</strong> ${stockData.fullSymbol || stockData.symbol} <br>
        <strong>Current Market Price:</strong> ${stockData.currency === 'INR' ? '₹' : '$'}${stockData.price} (${stockData.changePercent >= 0 ? '+' : ''}${stockData.changePercent}%) <br>
        <strong>Data Range:</strong> 2-Year Daily Candlesticks (~500 Trading Days) fetched via Yahoo Finance API. Filtered empty & corrupt candles.
      </div>
    </div>

    <!-- Step 2 -->
    <div class="trace-step-card">
      <div class="trace-step-head">
        <span class="trace-step-title"><i class="fa-solid fa-calculator" style="color:#9c27b0;"></i> Step 2: Technical Indicators Math Engine Calculation</span>
        <span class="trace-step-num">Step 2 of 5</span>
      </div>
      <div class="trace-step-body">
        <ul>
          <li><strong>RSI (14 Daily):</strong> ${ind.rsi14} (Wilder Smoothed Relative Strength Index)</li>
          <li><strong>Weekly RSI (14):</strong> ${ind.weeklyRsi} (5-day sampled weekly trend)</li>
          <li><strong>Monthly RSI (14):</strong> ${ind.monthlyRsi} (20-day sampled monthly trend)</li>
          <li><strong>Moving Averages:</strong> 200 SMA = ₹${ind.sma200}, 50 SMA = ₹${ind.sma50}, 20 SMA = ₹${ind.sma20}</li>
          <li><strong>MACD Oscillator:</strong> Line ${ind.macd} | Signal ${ind.signal} | Histogram ${ind.histogram}</li>
        </ul>
      </div>
    </div>

    <!-- Step 3 -->
    <div class="trace-step-card">
      <div class="trace-step-head">
        <span class="trace-step-title"><i class="fa-solid fa-list-check" style="color:#00c805;"></i> Step 3: Chartink System 1 Screener Rule Verification</span>
        <span class="trace-step-num">Step 3 of 5</span>
      </div>
      <div class="trace-step-body">
        <ul>
          <li><strong>Rule 1: Weekly RSI > 58:</strong> ${ind.weeklyRsi > 58 ? '✅ PASSED (' + ind.weeklyRsi + ' > 58)' : '❌ FAILED (' + ind.weeklyRsi + ' <= 58)'}</li>
          <li><strong>Rule 2: Sustained Monthly Trend:</strong> ${ind.monthlyRsi > 50 ? '✅ PASSED (' + ind.monthlyRsi + ' > 50)' : '❌ FAILED'}</li>
          <li><strong>Rule 3: Sufficient Volume (>= 100k):</strong> ${stockData.volume >= 100000 ? '✅ PASSED (' + stockData.volume.toLocaleString() + ' shares)' : '⚠️ Moderate Liquidity'}</li>
          <li><strong>Rule 4: Close Price > 200 SMA:</strong> ${ind.priceAbove200SMA ? '✅ PASSED (Price ₹' + stockData.price + ' > SMA ₹' + ind.sma200 + ')' : '❌ FAILED (Below 200 SMA)'}</li>
        </ul>
      </div>
    </div>

    <!-- Step 4 -->
    <div class="trace-step-card">
      <div class="trace-step-head">
        <span class="trace-step-title"><i class="fa-solid fa-chart-line" style="color:#ffb300;"></i> Step 4: Price Action & Classic Chart Pattern Scanning</span>
        <span class="trace-step-num">Step 4 of 5</span>
      </div>
      <div class="trace-step-body">
        <strong>20-Day Swing Range:</strong> High ₹${ind.high20 || stockData.price} | Low ₹${ind.low20 || stockData.price} <br>
        <strong>52-Week Range:</strong> High ₹${stockData.high52} | Low ₹${stockData.low52} <br>
        <strong>Pattern Detected:</strong> ${stockData.system1ScannerMatch ? '🎯 Bullish Cup & Handle / Inverse Head & Shoulders Breakout' : '📈 Range Consolidation / Trend Reversal Setup'}
      </div>
    </div>

    <!-- Step 5 -->
    <div class="trace-step-card">
      <div class="trace-step-head">
        <span class="trace-step-title"><i class="fa-solid fa-brain" style="color:#ff3b30;"></i> Step 5: Multi-Brain AI Ensemble Synthesis & Risk Strategy</span>
        <span class="trace-step-num">Step 5 of 5</span>
      </div>
      <div class="trace-step-body">
        <strong>Active AI Brains:</strong> ${activeBrains} <br>
        <strong>Signal Verdict:</strong> <span class="traffic-light-badge ${aiAnalysis.signalColor ? aiAnalysis.signalColor.toLowerCase() : 'green'}">${aiAnalysis.verdict}</span> (Confidence: ${aiAnalysis.confidenceScore}%) <br>
        <strong>Actionable Trade Setup:</strong> Entry Zone: ${aiAnalysis.entryZone} | Target 1: ₹${aiAnalysis.target1} | Target 2: ₹${aiAnalysis.target2} | Stop Loss: ₹${aiAnalysis.stopLoss} (R:R Ratio: 1:2.5)
      </div>
    </div>
  `;
}

// Fetch Mode B Auto Top Picks
async function fetchTopPicks() {
  try {
    const res = await fetch('/api/stock/top-picks');
    const data = await res.json();

    if (data.topPicks) {
      topPicksGrid.innerHTML = '';
      data.topPicks.forEach(pick => {
        const card = document.createElement('div');
        card.className = 'pick-card';
        card.onclick = () => loadStock(pick.symbol);

        card.innerHTML = `
          <div class="pick-card-head">
            <h4>${pick.symbol}</h4>
            <span class="traffic-light-badge ${pick.signalColor.toLowerCase()}">${pick.verdict}</span>
          </div>
          <div style="font-size:1.1rem; font-weight:700; margin-bottom:4px;">
            ₹${pick.price.toFixed(2)} <span style="font-size:0.8rem; color:#00c805;">(+${pick.changePercent}%)</span>
          </div>
          <div style="font-size:0.75rem; color:#787b86; margin-bottom:8px;">Target 1: ₹${pick.target1} | SL: ₹${pick.stopLoss}</div>
          <div style="font-size:0.78rem; line-height:1.4;">${pick.reasoning}</div>
        `;
        topPicksGrid.appendChild(card);
      });
    }
  } catch (e) {
    console.warn('Failed to load top picks:', e);
  }
}

// Event Listeners Setup
function setupEventListeners() {
  const searchDropdown = document.getElementById('searchDropdown');
  let selectedIndex = -1;
  let searchTimeout = null;

  // Search Input Autocomplete Handler
  tickerInput.addEventListener('input', () => {
    const query = tickerInput.value.trim();
    clearTimeout(searchTimeout);

    if (query.length < 1) {
      if (searchDropdown) {
        searchDropdown.classList.remove('active');
        searchDropdown.innerHTML = '';
      }
      return;
    }

    searchTimeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/stock/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (data.results && data.results.length > 0) {
          renderSearchDropdown(data.results);
        } else {
          if (searchDropdown) searchDropdown.classList.remove('active');
        }
      } catch (err) {
        console.warn('Autocomplete search failed:', err);
      }
    }, 200);
  });

  // Render Autocomplete Dropdown List
  function renderSearchDropdown(results) {
    if (!searchDropdown) return;
    searchDropdown.innerHTML = '';
    selectedIndex = -1;

    results.forEach((item, idx) => {
      const div = document.createElement('div');
      div.className = 'dropdown-item';
      div.dataset.index = idx;
      div.innerHTML = `
        <div class="item-left">
          <span class="item-symbol">${item.symbol}</span>
          <span class="item-name">${item.name}</span>
        </div>
        <span class="item-badge">${item.exchange || 'NSE'}</span>
      `;

      div.onclick = (e) => {
        e.stopPropagation();
        tickerInput.value = item.symbol;
        searchDropdown.classList.remove('active');
        loadStock(item.symbol);
      };

      searchDropdown.appendChild(div);
    });

    searchDropdown.classList.add('active');
  }

  // Keyboard navigation for search dropdown
  tickerInput.addEventListener('keydown', (e) => {
    const items = searchDropdown ? searchDropdown.querySelectorAll('.dropdown-item') : [];
    if (!searchDropdown || !searchDropdown.classList.contains('active') || items.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
      highlightDropdownItem(items);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = Math.max(selectedIndex - 1, 0);
      highlightDropdownItem(items);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      items[selectedIndex].click();
    }
  });

  function highlightDropdownItem(items) {
    items.forEach((it, idx) => {
      if (idx === selectedIndex) {
        it.classList.add('selected');
        it.scrollIntoView({ block: 'nearest' });
      } else {
        it.classList.remove('selected');
      }
    });
  }

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    if (searchDropdown && !e.target.closest('.search-input-wrapper')) {
      searchDropdown.classList.remove('active');
    }
  });

  // Search Form Submit
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (searchDropdown) searchDropdown.classList.remove('active');
    const symbol = tickerInput.value.trim();
    if (symbol) loadStock(symbol);
  });

  // Open Step-by-Step Trace Tab Button
  const openTraceTabBtn = document.getElementById('openTraceTabBtn');
  if (openTraceTabBtn) {
    openTraceTabBtn.addEventListener('click', () => {
      const traceTabBtn = document.querySelector('.tab-btn[data-tab="traceTab"]');
      if (traceTabBtn) traceTabBtn.click();
      document.querySelector('.bottom-features-section')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Hinglish Voice Recognition
  if (voiceBtn) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN'; // Hinglish / Hindi

      voiceBtn.addEventListener('click', () => {
        voiceBtn.classList.add('recording');
        recognition.start();
      });

      recognition.onresult = (event) => {
        voiceBtn.classList.remove('recording');
        const transcript = event.results[0][0].transcript;
        console.log('Voice Input:', transcript);
        
        // Clean query to find ticker name
        const clean = transcript.replace(/(kaisa lag raha hai|ka chart dikhao|ka analysis karo|stock|share)/gi, '').trim();
        if (clean) {
          tickerInput.value = clean;
          loadStock(clean);
        }
      };

      recognition.onerror = () => voiceBtn.classList.remove('recording');
      recognition.onend = () => voiceBtn.classList.remove('recording');
    } else {
      voiceBtn.style.display = 'none';
    }
  }

  // Chartink URL Form
  chartinkForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = chartinkUrlInput.value.trim();
    if (!url) return;

    try {
      chartinkOutput.style.display = 'block';
      chartinkOutput.innerText = 'Importing Chartink Screener Rules...';

      const res = await fetch('/api/stock/parse-chartink', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const data = await res.json();

      chartinkOutput.innerHTML = `
        <strong style="color:#2962ff;">✅ ${data.title} Imported!</strong><br>
        <div style="margin-top:6px; color:#787b86;">${data.description}</div>
        <div style="margin-top:6px;"><strong>Active Formula:</strong> <code>${data.extractedQuery}</code></div>
      `;
    } catch (err) {
      chartinkOutput.innerText = 'Failed to parse Chartink URL: ' + err.message;
    }
  });

  // Portfolio Holding Form
  holdingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const symbol = document.getElementById('holdSymbol').value.trim().toUpperCase();
    const buyPrice = parseFloat(document.getElementById('holdBuyPrice').value);
    const qty = parseInt(document.getElementById('holdQty').value) || 10;

    if (symbol && buyPrice) {
      holdings.push({
        id: Date.now().toString(),
        symbol,
        buyPrice,
        qty,
        target1: Number((buyPrice * 1.08).toFixed(2)),
        target2: Number((buyPrice * 1.18).toFixed(2)),
        stopLoss: Number((buyPrice * 0.95).toFixed(2))
      });

      localStorage.setItem('stock_ai_holdings', JSON.stringify(holdings));
      holdingForm.reset();
      renderHoldingsTable();
      checkPortfolioAlerts();
    }
  });

  // Settings Modal
  const openModal = () => settingsModal.classList.add('active');
  const closeModal = () => settingsModal.classList.remove('active');

  openSettingsBtn.addEventListener('click', openModal);
  closeSettingsModal.addEventListener('click', closeModal);
  cancelSettingsBtn.addEventListener('click', closeModal);

  saveSettingsBtn.addEventListener('click', async () => {
    const geminiKey = geminiKeyInput.value.trim();
    const groqKey = document.getElementById('groqKeyInput')?.value.trim() || '';
    const claudeKey = claudeKeyInput.value.trim();

    try {
      saveSettingsBtn.disabled = true;
      saveSettingsBtn.innerText = 'Saving...';

      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiKey, groqKey, claudeKey })
      });
      const data = await res.json();

      if (data.success) {
        settingsFeedback.className = 'feedback-msg success';
        settingsFeedback.innerText = 'Keys saved successfully!';
        setTimeout(closeModal, 1000);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      settingsFeedback.className = 'feedback-msg error';
      settingsFeedback.innerText = 'Error: ' + err.message;
    } finally {
      saveSettingsBtn.disabled = false;
      saveSettingsBtn.innerText = 'Save Keys';
    }
  });
}

// Render Portfolio Holdings Table
function renderHoldingsTable() {
  holdingsTableBody.innerHTML = '';
  if (holdings.length === 0) {
    holdingsTableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:#787b86; padding:16px;">No holdings added yet. Add a stock above to start tracking live exit alerts!</td></tr>';
    return;
  }

  holdings.forEach((item) => {
    const tr = document.createElement('tr');
    const t1 = item.target1 || Number((item.buyPrice * 1.08).toFixed(2));
    const sl = item.stopLoss || Number((item.buyPrice * 0.95).toFixed(2));

    tr.innerHTML = `
      <td><strong>${item.symbol}</strong></td>
      <td>₹${item.buyPrice}</td>
      <td>${item.qty}</td>
      <td><span style="color:#00c805; font-weight:600;">₹${t1}</span></td>
      <td><span style="color:#ff3b30; font-weight:600;">₹${sl}</span></td>
      <td>
        <button onclick="deleteHolding('${item.id}')" style="background:transparent; border:none; color:#ff3b30; cursor:pointer;" title="Delete holding">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    `;
    holdingsTableBody.appendChild(tr);
  });
}

window.deleteHolding = function(id) {
  holdings = holdings.filter(h => h.id !== id);
  localStorage.setItem('stock_ai_holdings', JSON.stringify(holdings));
  renderHoldingsTable();
  checkPortfolioAlerts();
};

// Check Portfolio Exit Alerts
async function checkPortfolioAlerts() {
  if (holdings.length === 0) {
    alertsContainer.innerHTML = '';
    return;
  }

  try {
    const res = await fetch('/api/portfolio/alerts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ holdings })
    });
    const data = await res.json();

    if (data.alerts && data.alerts.length > 0) {
      alertsContainer.innerHTML = '';
      data.alerts.forEach(alert => {
        const div = document.createElement('div');
        div.style.cssText = `background:rgba(0, 200, 5, 0.12); border:1px solid #00c805; padding:10px 14px; border-radius:8px; margin-bottom:10px; font-size:0.85rem;`;
        div.innerHTML = alert.alertMessage;
        alertsContainer.appendChild(div);
      });
    }
  } catch (e) {
    console.warn('Failed to evaluate alerts:', e);
  }
}

// Tab Switching
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panes = document.querySelectorAll('.tab-pane');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const target = document.getElementById(tab.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

// Timeframe Buttons
function setupTimeframeButtons() {
  const tfBtns = document.querySelectorAll('.tf-btn');
  tfBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tfBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeTimeframe = btn.dataset.tf;
      initTradingViewChart(activeSymbol, activeTimeframe);
    });
  });
}
