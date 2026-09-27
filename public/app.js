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

  const container = document.getElementById('tradingview_chart_container');
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
