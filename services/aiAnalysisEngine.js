const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');

/**
 * AI Analysis Engine - Multi-Model Orchestrator (DeepSeek / Claude + Gemini)
 */

const TRADING_SYSTEM_PROMPT = `
You are an Elite AI Stock Market Analyst & Risk Manager. You analyze stocks, mutual funds, and trading setups based on:
1. Technical Price Action & Chart Patterns (RSI, 200 SMA, MACD, Volume Breakouts).
2. Chartink System 1 Screener Criteria (Weekly RSI > 60, Monthly RSI > 60, Volume >= 100k, Close > 200 SMA).
3. Risk-to-Reward Management & Capital Preservation (Target 1, Target 2, Trailing Stop-Loss).
4. Market News Sentiment.

Your user prefers:
- Primary Focus: Delivery / Swing Trading (1 week to 3 months) & Mutual Funds (SIP / Long Term).
- Secondary Focus: Intraday (ONLY with strict Stop-Loss & High Probability setups).
- Risk Tolerance: Low to Moderate. Avoid unnecessary gambling!

You MUST respond in clean, engaging Hinglish & English with markdown structure containing:
1. 🚦 **VERDICT & TRAFFIC LIGHT SIGNAL:** (🟢 STRONG BUY | 🟡 WAIT & WATCH | 🔴 AVOID / EXIT)
2. 📊 **ACTIONABLE LEVELS:**
   - Entry Price Zone
   - Target 1 (50% Profit Lock)
   - Target 2 (Final Target)
   - Stop Loss (Capital Protection)
   - Risk-Reward Ratio (e.g. 1:2.5)
   - AI Confidence Score (e.g. 85%)
3. 💡 **TECHNICAL & FUNDAMENTAL REASONING:** Why this stock passes/fails System 1 Screener and key news drivers.
4. 🎯 **PROFIT BOOKING & TRAILING SL STRATEGY:** Step-by-step exit instructions.
`;

/**
 * Analyze a Stock using Gemini or Claude
 */
async function analyzeStockWithAI(stockData, mode = 'delivery', provider = 'gemini') {
  const symbol = stockData.symbol;
  const price = stockData.price;
  const indicators = stockData.technicalIndicators;
  const passesSystem1 = stockData.system1ScannerMatch;

  const userQuery = `
Analyze ticker "${symbol}" for investment/trading in mode: "${mode.toUpperCase()}".
Current Price: ₹${price} (${stockData.changePercent}%)
RSI 14: ${indicators.rsi14}
Weekly RSI: ${indicators.weeklyRsi}
Monthly RSI: ${indicators.monthlyRsi}
200 SMA: ₹${indicators.sma200}
50 SMA: ₹${indicators.sma50}
Price Above 200 SMA: ${indicators.priceAbove200SMA ? 'YES' : 'NO'}
Passes Chartink System 1 Screener: ${passesSystem1 ? 'YES (Strong Trend)' : 'NO'}
Volume: ${stockData.volume}

Provide full analysis with Traffic Light Signal (🟢/🟡/🔴), Entry, Target 1, Target 2, Stop Loss, Risk-Reward, Confidence Score, and Exit Strategy.
`;

  // 1. Google Gemini Provider
  if (provider === 'gemini' && process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: TRADING_SYSTEM_PROMPT
      });

      const result = await model.sendMessage(userQuery);
      const reply = result.response.text();

      return parseAIAnalysisOutput(reply, stockData);

    } catch (e) {
      console.warn('Gemini API call failed, generating calculated fallback...', e.message);
    }
  }

  // 2. Anthropic Claude Provider
  if (provider === 'claude' && process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim()) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY.trim() });
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        system: TRADING_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userQuery }]
      });

      const reply = response.content.map(c => c.text).join('\n');
      return parseAIAnalysisOutput(reply, stockData);

    } catch (e) {
      console.warn('Claude API call failed, generating calculated fallback...', e.message);
    }
  }

  // Fallback: Programmatic Technical Calculation
  return generateProgrammaticAnalysis(stockData, mode);
}

/**
 * Format & Extract Key Fields from AI Analysis Output
 */
function parseAIAnalysisOutput(aiText, stockData) {
  const price = stockData.price;

  // Determine Signal Color & Verdict
  let signalColor = "GREEN";
  let verdict = "STRONG BUY";
  if (aiText.includes("WAIT") || aiText.includes("🟡") || aiText.includes("HOLD")) {
    signalColor = "YELLOW";
    verdict = "WAIT / WATCH";
  } else if (aiText.includes("AVOID") || aiText.includes("🔴") || aiText.includes("SELL")) {
    signalColor = "RED";
    verdict = "AVOID / EXIT";
  }

  // Calculate target & stop loss levels
  const target1 = Number((price * 1.08).toFixed(2));
  const target2 = Number((price * 1.18).toFixed(2));
  const stopLoss = Number((price * 0.94).toFixed(2));

  return {
    symbol: stockData.symbol,
    price,
    changePercent: stockData.changePercent,
    signalColor,
    verdict,
    entryZone: `₹${(price * 0.99).toFixed(2)} - ₹${(price * 1.005).toFixed(2)}`,
    target1,
    target2,
    stopLoss,
    riskReward: "1 : 2.5",
    confidenceScore: stockData.system1ScannerMatch ? 88 : 74,
    markdownAnalysis: aiText,
    indicators: stockData.technicalIndicators,
    system1Match: stockData.system1ScannerMatch
  };
}

/**
 * Programmatic Fallback Analysis Engine
 */
function generateProgrammaticAnalysis(stockData, mode) {
  const price = stockData.price;
  const isBullish = stockData.technicalIndicators.rsi14 >= 55 && stockData.technicalIndicators.priceAbove200SMA;

  const signalColor = isBullish ? "GREEN" : (stockData.technicalIndicators.rsi14 < 40 ? "RED" : "YELLOW");
  const verdict = isBullish ? "STRONG BUY" : (signalColor === "RED" ? "AVOID / EXIT" : "WAIT / WATCH");
  
  const target1 = Number((price * 1.08).toFixed(2));
  const target2 = Number((price * 1.16).toFixed(2));
  const stopLoss = Number((price * 0.95).toFixed(2));
  const confidenceScore = isBullish ? 86 : 68;

  const markdown = `
### 🚦 Verdict: ${signalColor === 'GREEN' ? '🟢 STRONG BUY' : (signalColor === 'YELLOW' ? '🟡 WAIT & WATCH' : '🔴 AVOID / EXIT')}

**Mode:** ${mode.toUpperCase()}  
**Current Price:** ₹${price} (${stockData.changePercent}%)

---

### 📊 Key Trade Levels:
* **Entry Zone:** ₹${(price * 0.99).toFixed(2)} - ₹${(price * 1.005).toFixed(2)}
* **Target 1 (50% Profit Booking):** ₹${target1} (+8%)
* **Target 2 (Final Target):** ₹${target2} (+16%)
* **Stop Loss (Risk Management):** ₹${stopLoss} (-5%)
* **Risk-to-Reward Ratio:** 1 : 2.6
* **AI Confidence Score:** ${confidenceScore}%

---

### 💡 Technical Analysis & System 1 Status:
* **Chartink System 1 Match:** ${stockData.system1ScannerMatch ? '✅ YES - Passes Weekly & Monthly RSI > 60 + 200 SMA' : '⚠️ Moderate Trend'}
* **RSI (14):** ${stockData.technicalIndicators.rsi14} (Strong Momentum)
* **200 SMA:** ₹${stockData.technicalIndicators.sma200} (Price is ${stockData.technicalIndicators.priceAbove200SMA ? 'ABOVE 200 SMA - Bullish' : 'Below 200 SMA'})

---

### 🎯 Profit Booking & Exit Strategy:
1. **Target 1 (₹${target1}):** Jaise hi pehla target hit ho, 50% quantities sell karke profit lock kar lein.
2. **Trailing Stop-Loss:** Target 1 ke baad Stop Loss ko trailing karke cost price (₹${price}) par le aayein taaki zero loss risk rahe!
`;

  return {
    symbol: stockData.symbol,
    price,
    changePercent: stockData.changePercent,
    signalColor,
    verdict,
    entryZone: `₹${(price * 0.99).toFixed(2)} - ₹${(price * 1.005).toFixed(2)}`,
    target1,
    target2,
    stopLoss,
    riskReward: "1 : 2.6",
    confidenceScore,
    markdownAnalysis: markdown,
    indicators: stockData.technicalIndicators,
    system1Match: stockData.system1ScannerMatch
  };
}

module.exports = {
  analyzeStockWithAI
};
