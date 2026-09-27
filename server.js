const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { getStockQuoteAndIndicators, searchStocks } = require('./services/stockDataService');
const { parseChartinkURL, getTopSystem1Picks, SYSTEM_1_RULES } = require('./services/chartinkParser');
const { evaluatePortfolioAlerts } = require('./services/portfolioService');
const { analyzeStockWithAI } = require('./services/aiAnalysisEngine');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 1. Live Stock Search Autocomplete Endpoint
app.get('/api/stock/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const results = await searchStocks(query);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: 'Search error: ' + error.message });
  }
});

// 2. API Key Status Endpoint
app.get('/api/status', (req, res) => {
  res.json({
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()),
    groqConfigured: !!(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()),
    claudeConfigured: !!(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim()),
    system1Rules: SYSTEM_1_RULES
  });
});

// 3. Save API Keys from UI Settings Modal
app.post('/api/settings', (req, res) => {
  try {
    const { geminiKey, groqKey, claudeKey } = req.body;
    
    if (geminiKey !== undefined) process.env.GEMINI_API_KEY = geminiKey.trim();
    if (groqKey !== undefined) process.env.GROQ_API_KEY = groqKey.trim();
    if (claudeKey !== undefined) process.env.ANTHROPIC_API_KEY = claudeKey.trim();

    try {
      const envPath = path.join(__dirname, '.env');
      const envContent = `PORT=${PORT}\nGEMINI_API_KEY=${process.env.GEMINI_API_KEY || ''}\nGROQ_API_KEY=${process.env.GROQ_API_KEY || ''}\nANTHROPIC_API_KEY=${process.env.ANTHROPIC_API_KEY || ''}\n`;
      fs.writeFileSync(envPath, envContent, 'utf8');
    } catch (fsErr) {
      console.warn('Fs write warning (Read-only container):', fsErr.message);
    }

    res.json({ success: true, message: 'API Keys updated in memory successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save settings: ' + error.message });
  }
});

// 4. Fetch Stock Quote & Indicators
app.get('/api/stock/quote/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol;
    const stockData = await getStockQuoteAndIndicators(symbol);
    res.json(stockData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch quote: ' + error.message });
  }
});

// 5. Mode A: Deep AI Analysis Endpoint (User Ticker Input)
app.post('/api/stock/analyze', async (req, res) => {
  try {
    const { symbol, mode = 'delivery', provider = 'ensemble' } = req.body;

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

// 6. Mode B: Auto Market Discovery & Daily Top Picks (Chartink System 1 Scanner)
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

// 7. Dynamic Chartink URL Parser Endpoint
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

// 8. Portfolio Exit & Trailing SL Alerts Evaluator (Concurrent Promise.all)
app.post('/api/portfolio/alerts', async (req, res) => {
  try {
    const { holdings = [] } = req.body;
    if (holdings.length === 0) {
      return res.json({ alerts: [] });
    }

    // Fetch live quotes for holdings concurrently in parallel
    const liveQuotes = {};
    const validHoldings = holdings.filter(item => item && item.symbol);
    
    await Promise.all(validHoldings.map(async (item) => {
      try {
        const quote = await getStockQuoteAndIndicators(item.symbol);
        liveQuotes[item.symbol.toUpperCase()] = quote;
      } catch (e) {
        console.warn(`Quote fetch failed for holding ${item.symbol}:`, e.message);
      }
    }));

    const alerts = evaluatePortfolioAlerts(holdings, liveQuotes);
    res.json({ success: true, alerts });

  } catch (error) {
    res.status(500).json({ error: 'Portfolio alerts evaluation error: ' + error.message });
  }
});

// 9. In-App AI Guide Copilot Endpoint
app.post('/api/copilot/chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const copilotSystemPrompt = `
You are "Stock AI Assistant Guide" — the official embedded AI Concierge & Helper for this Stock Market AI Terminal.
Your job is to answer user questions about how to use this app, where to find features, stock market concepts, Chartink screeners, Mutual Funds, and Portfolio alerts in clear, friendly Hinglish.

App Knowledge Base:
1. Search Bar & Autocomplete: Top header. Type any Indian stock (NSE/BSE), Mutual Fund, or US stock (e.g. Tata Motors, Reliance, NVDA, Parag Parikh). Shows live dropdown suggestions.
2. Mode A (Stock Analysis): Enter stock name -> Generates 🚦 Verdict (🟢 STRONG BUY, 🟡 WAIT, 🔴 AVOID), ⏱️ Recommended Holding Period, Entry Zone, Target 1, Target 2, Stop Loss, and Chart Pattern.
3. Mode B (Auto Top Picks): Bottom tab "Mode B: Auto Top AI Picks". Shows daily automated scanner picks matching Weekly & Monthly RSI > 60 + 200 SMA.
4. Simple View vs Pro View Toggle: Top header. "Simple View" hides technical clutter for beginners. "Pro View" shows RSI, 200 SMA, MACD, and AI Model Selectors.
5. Chartink Screener Parser: Bottom tab "Chartink URL Parser". Paste any Chartink link to import scanning formulas.
6. My Portfolio & Exit Alerts: Bottom tab "My Portfolio & Exit Alerts". Add your buy price & quantity to get automated Target 1 / Target 2 / Trailing Stop-Loss exit alerts.
7. Step-by-Step AI Research Trace: Bottom tab "Step-by-Step AI Research Trace" or inline button under AI Analysis card. Shows 5-step detailed audit timeline of how AI fetched data and calculated targets.
8. Mutual Funds: Mutual Funds calculate daily NAVs, not intraday candles. Searching a Mutual Fund displays a custom NAV Performance Overlay + Top Stock Holdings + Equivalent Index ETF suggestions.

Always respond in polite, clear Hinglish with short bullet points and helpful emojis.
`;

    let reply = "";

    // Try Gemini API first if available
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: copilotSystemPrompt });
        const result = await model.sendMessage(message);
        reply = result.response.text();
      } catch (e) {
        console.warn('Gemini Copilot failed, trying Groq fallback...', e.message);
      }
    }

    // Try Groq API fallback if Gemini is not configured or failed
    if (!reply && process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
      try {
        const axios = require('axios');
        const groqRes = await axios.post(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            model: 'llama-3.3-70b-versatile',
            messages: [
              { role: 'system', content: copilotSystemPrompt },
              { role: 'user', content: message }
            ],
            temperature: 0.3
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.GROQ_API_KEY.trim()}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        reply = groqRes.data?.choices?.[0]?.message?.content || "";
      } catch (e) {
        console.warn('Groq Copilot failed:', e.message);
      }
    }

    // Programmatic Smart Fallback if no API keys configured
    if (!reply) {
      const msg = message.toLowerCase();
      if (msg.includes('search') || msg.includes('stock') || msg.includes('kaise')) {
        reply = "🔍 **Stock Search Kaise Karein?**\n* Top header bar me stock name (e.g. *Tata Motors*, *Reliance*, *Nifty*) type karein.\n* Dropdown suggestions aane par select karke `Analyze Stock` click karein!";
      } else if (msg.includes('portfolio') || msg.includes('alert') || msg.includes('stop loss')) {
        reply = "💼 **Portfolio Exit Alerts Kaise Use Karein?**\n* Niche **My Portfolio & Exit Alerts** tab par jayein.\n* Apne stock ka Buy Price & Qty add karein. AI aapko Target 1 (+8%) aur Stop Loss (-5%) hit hote hi exit alerts batayega!";
      } else if (msg.includes('mutual fund') || msg.includes('nav') || msg.includes('chart')) {
        reply = "🏛️ **Mutual Funds Kaise Dekhein?**\n* Search bar me Mutual Fund name type karein (e.g. *Parag Parikh*, *Quant Small Cap*).\n* Mutual Funds me daily NAV hota hai, isliye candle chart ki jagah NAV Performance Dashboard + Top Holdings dikhai dengi!";
      } else if (msg.includes('simple') || msg.includes('pro')) {
        reply = "⚡ **Simple View vs 📊 Pro View Toggle:**\n* Top header me `Simple View` (beginners ke liye clean UI) aur `Pro View` (full technical RSI & SMA indicators) switch kar sakte hain!";
      } else {
        reply = `🤖 **Stock AI Guide:** Aap search bar se koi bhi Stock/Mutual Fund analyze kar sakte hain. Aapka query: "${message}". Aap Header me ` + "`Simple View`" + ` / ` + "`Pro View`" + ` switch kar sakte hain!`;
      }
    }

    res.json({ success: true, reply });

  } catch (error) {
    res.status(500).json({ error: 'Copilot AI error: ' + error.message });
  }
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Stock Market AI Terminal running at:`);
  console.log(`👉 Local:   http://localhost:${PORT}`);
  console.log(`👉 Render:  Production Ready for 24/7 Deployment`);
  console.log(`====================================================`);
});
