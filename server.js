const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { getStockQuoteAndIndicators } = require('./services/stockDataService');
const { parseChartinkURL, getTopSystem1Picks, SYSTEM_1_RULES } = require('./services/chartinkParser');
const { evaluatePortfolioAlerts } = require('./services/portfolioService');
const { analyzeStockWithAI } = require('./services/aiAnalysisEngine');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. API Key Status Endpoint
app.get('/api/status', (req, res) => {
  res.json({
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()),
    claudeConfigured: !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim()),
    system1Rules: SYSTEM_1_RULES
  });
});

// 2. Save API Keys from UI Settings Modal
app.post('/api/settings', (req, res) => {
  try {
    const { geminiKey, claudeKey } = req.body;
    const envPath = path.join(__dirname, '.env');
    
    if (geminiKey !== undefined) process.env.GEMINI_API_KEY = geminiKey.trim();
    if (claudeKey !== undefined) process.env.ANTHROPIC_API_KEY = claudeKey.trim();

    const envContent = `PORT=${PORT}\nGEMINI_API_KEY=${process.env.GEMINI_API_KEY || ''}\nANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY || ''}\n`;
    fs.writeFileSync(envPath, envContent, 'utf8');

    res.json({ success: true, message: 'API Keys saved successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings: ' + error.message });
  }
});

// 3. Fetch Stock Quote & Indicators
app.get('/api/stock/quote/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const stockData = await getStockQuoteAndIndicators(symbol);
    res.json(stockData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quote: ' + error.message });
  }
});

// 4. Mode A: Deep AI Analysis Endpoint (User Ticker Input)
app.post('/api/stock/analyze', async (req, res) => {
  try {
    const { symbol, mode = 'delivery', provider = 'gemini' } = req.body;

    if (!symbol || !symbol.trim()) {
      return res.status(400).json({ error: 'Stock ticker or name is required.' });
    }

    // Fetch quote & technical indicators first
    const stockData = await getStockQuoteAndIndicators(symbol);

    // Perform Multi-Model AI Analysis
    const aiAnalysis = await analyzeStockWithAI(stockData, mode, provider);

    res.json({
      success: true,
      stockData,
      aiAnalysis
    });

  } catch (error) {
    console.error('Stock Analyze Error:', error);
    res.status(500).json({ error: 'AI Stock Analysis error: ' + error.message });
  }
});

// 5. Mode B: Auto Market Discovery & Daily Top Picks (Chartink System 1 Scanner)
app.get('/api/stock/top-picks', (req, res) => {
  try {
    const picks = getTopSystem1Picks();
    res.json({
      success: true,
      scanner: SYSTEM_1_RULES,
      topPicks: picks
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load top picks: ' + error.message });
  }
});

// 6. Dynamic Chartink URL Parser Endpoint
app.post('/api/stock/parse-chartink', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Chartink URL is required.' });
    }

    const parsedData = await parseChartinkURL(url);
    res.json(parsedData);

  } catch (error) {
    res.status(500).json({ error: 'Failed to parse Chartink URL: ' + error.message });
  }
});

// 7. Portfolio Exit & Trailing SL Alerts Evaluator
app.post('/api/portfolio/alerts', async (req, res) => {
  try {
    const { holdings = [] } = req.body;
    if (holdings.length === 0) {
      return res.json({ alerts: [] });
    }

    // Fetch live quotes for holdings
    const liveQuotes = {};
    for (const item of holdings) {
      if (item.symbol) {
        const quote = await getStockQuoteAndIndicators(item.symbol);
        liveQuotes[item.symbol.toUpperCase()] = quote;
      }
    }

    const alerts = evaluatePortfolioAlerts(holdings, liveQuotes);
    res.json({ success: true, alerts });

  } catch (error) {
    res.status(500).json({ error: 'Portfolio alerts evaluation error: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Stock Market AI Terminal running at:`);
  console.log(`👉 Local:   http://localhost:${PORT}`);
  console.log(`👉 Render:  Production Ready for 24/7 Deployment`);
  console.log(`====================================================`);
});
