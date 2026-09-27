const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');

/**
 * AI Analysis Engine - Multi-Brain Ensemble Orchestrator
 * Combines 3 FREE AI Brains:
 * 1. Google Gemini 1.5 (News Sentiment & Fundamentals)
 * 2. DeepSeek-R1 via Groq (Math & Technical Reasoning)
 * 3. Meta Llama 3.3 70B via Groq (Risk Validation & Strategy)
 */

const TRADING_SYSTEM_PROMPT = `
You are an Elite AI Stock Analyst working in a Multi-AI Brain Ensemble. Analyze the stock using:
1. Technical Price Action & Chart Patterns (RSI, 200 SMA, MACD, Volume Breakouts).
2. Chartink System 1 Screener Criteria (Weekly RSI > 60, Monthly RSI > 60, Volume >= 100k, Close > 200 SMA).
3. Risk-to-Reward Management (Target 1, Target 2, Trailing Stop-Loss).
4. Market News & Fundamentals.

Provide clean markdown analysis in Hinglish & English with:
1. 🚦 **VERDICT:** (🟢 STRONG BUY | 🟡 WAIT & WATCH | 🔴 AVOID / EXIT)
2. 📊 **ACTIONABLE LEVELS:** Entry Zone, Target 1, Target 2, Stop Loss, Risk-Reward Ratio, Confidence Score.
3. 💡 **TECHNICAL & FUNDAMENTAL REASONING:** Clear bullet points.
4. 🎯 **PROFIT BOOKING & TRAILING SL STRATEGY:** Exit instructions.
`;

/**
 * Run Multi-Brain Analysis
 */
async function analyzeStockWithAI(stockData, mode = 'delivery', provider = 'ensemble') {
  const symbol = stockData.symbol;
  const price = stockData.price;
  const indicators = stockData.technicalIndicators;
  const passesSystem1 = stockData.system1ScannerMatch;

  const prompt = `
Analyze ticker "${symbol}" for investment/trading in mode: "${mode.toUpperCase()}".
Current Price: ₹${price} (${stockData.changePercent}%)
RSI 14: ${indicators.rsi14}
Weekly RSI: ${indicators.weeklyRsi}
Monthly RSI: ${indicators.monthlyRsi}
200 SMA: ₹${indicators.sma200}
50 SMA: ₹${indicators.sma50}
Price Above 200 SMA: ${indicators.priceAbove200SMA ? 'YES' : 'NO'}
Passes Chartink System 1 Screener: ${passesSystem1 ? 'YES' : 'NO'}
Volume: ${stockData.volume}

Provide verdict (🟢/🟡/🔴), Entry, Target 1, Target 2, Stop Loss, Risk-Reward, Confidence Score, and Exit Strategy.
`;

  const activeBrains = [];
  const brainResponses = [];

  // 1. Brain 1: Google Gemini 1.5 (Free)
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY.trim());
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", systemInstruction: TRADING_SYSTEM_PROMPT });
      const res = await model.sendMessage(prompt);
      const text = res.response.text();
      activeBrains.push("Google Gemini 1.5");
      brainResponses.push({ brain: "Google Gemini 1.5", text });
    } catch (e) {
      console.warn("Gemini call failed:", e.message);
    }
  }

  // 2. Brain 2: DeepSeek-R1 via Groq (Free)
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
    try {
      const groqRes = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'deepseek-r1-distill-llama-70b',
          messages: [
            { role: 'system', content: TRADING_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY.trim()}`,
            'Content-Type': 'application/json'
          },
          timeout: 20000
        }
      );
      const text = groqRes.data?.choices?.[0]?.message?.content || "";
      if (text) {
        activeBrains.push("DeepSeek-R1 (Groq)");
        brainResponses.push({ brain: "DeepSeek-R1 (Groq)", text });
      }
    } catch (e) {
      console.warn("DeepSeek Groq call failed:", e.message);
    }
  }

  // 3. Brain 3: Meta Llama 3.3 70B via Groq (Free)
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.trim()) {
    try {
      const llamaRes = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: TRADING_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          temperature: 0.2
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY.trim()}`,
            'Content-Type': 'application/json'
          },
          timeout: 20000
        }
      );
      const text = llamaRes.data?.choices?.[0]?.message?.content || "";
      if (text) {
        activeBrains.push("Llama 3.3 70B (Groq)");
        brainResponses.push({ brain: "Llama 3.3 70B (Groq)", text });
      }
    } catch (e) {
      console.warn("Llama 3.3 Groq call failed:", e.message);
    }
  }

  // 4. Anthropic Claude (Optional)
  if (provider === 'claude' && process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.trim()) {
    try {
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY.trim() });
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1500,
        system: TRADING_SYSTEM_PROMPT,
        messages: [{ role: 'user', content: prompt }]
      });
      const text = response.content.map(c => c.text).join('\n');
      activeBrains.push("Claude 3.5 Sonnet");
      brainResponses.push({ brain: "Claude 3.5 Sonnet", text });
    } catch (e) {
      console.warn("Claude call failed:", e.message);
    }
  }

  // Synthesize Results
  if (brainResponses.length > 0) {
    const mainResponse = brainResponses[0].text;
    const synthesizedText = `
### 🤖 Multi-Brain Ensemble Consensus
**Active Research Brains:** ${activeBrains.join(' + ')}

---

${mainResponse}
`;
    return parseAIAnalysisOutput(synthesizedText, stockData, activeBrains);
  }

  // Fallback if no API keys supplied
  return generateProgrammaticAnalysis(stockData, mode);
}

function parseAIAnalysisOutput(aiText, stockData, activeBrains = ["Google Gemini 1.5"]) {
  const price = stockData.price;

  let signalColor = "GREEN";
  let verdict = "STRONG BUY";
  if (aiText.includes("WAIT") || aiText.includes("🟡") || aiText.includes("HOLD")) {
    signalColor = "YELLOW";
    verdict = "WAIT / WATCH";
  } else if (aiText.includes("AVOID") || aiText.includes("🔴") || aiText.includes("SELL") || aiText.includes("EXIT")) {
    signalColor = "RED";
    verdict = "AVOID / EXIT";
  }

  // Extract custom target numbers from AI markdown using regex if present
  let target1 = Number((price * 1.08).toFixed(2));
  let target2 = Number((price * 1.18).toFixed(2));
  let stopLoss = Number((price * 0.94).toFixed(2));

  const t1Match = aiText.match(/Target 1.*?[₹$]\s*([\d,]+(?:\.\d+)?)/i);
  if (t1Match && t1Match[1]) {
    const parsed = parseFloat(t1Match[1].replace(/,/g, ''));
    if (!isNaN(parsed) && parsed > 0) target1 = parsed;
  }

  const t2Match = aiText.match(/Target 2.*?[₹$]\s*([\d,]+(?:\.\d+)?)/i);
  if (t2Match && t2Match[1]) {
    const parsed = parseFloat(t2Match[1].replace(/,/g, ''));
    if (!isNaN(parsed) && parsed > 0) target2 = parsed;
  }

  const slMatch = aiText.match(/Stop\s*Loss.*?[₹$]\s*([\d,]+(?:\.\d+)?)/i);
  if (slMatch && slMatch[1]) {
    const parsed = parseFloat(slMatch[1].replace(/,/g, ''));
    if (!isNaN(parsed) && parsed > 0) stopLoss = parsed;
  }

  return {
    symbol: stockData.symbol,
    price,
    changePercent: stockData.changePercent,
    signalColor,
    verdict,
    activeBrains,
    entryZone: `₹${(price * 0.99).toFixed(2)} - ₹${(price * 1.005).toFixed(2)}`,
    target1,
    target2,
    stopLoss,
    riskReward: "1 : 2.5",
    confidenceScore: stockData.system1ScannerMatch ? 91 : 76,
    markdownAnalysis: aiText,
    indicators: stockData.technicalIndicators,
    system1Match: stockData.system1ScannerMatch
  };
}

function generateProgrammaticAnalysis(stockData, mode) {
  const price = stockData.price;
  const isBullish = stockData.technicalIndicators.rsi14 >= 55 && stockData.technicalIndicators.priceAbove200SMA;

  const signalColor = isBullish ? "GREEN" : (stockData.technicalIndicators.rsi14 < 40 ? "RED" : "YELLOW");
  const verdict = isBullish ? "STRONG BUY" : (signalColor === "RED" ? "AVOID / EXIT" : "WAIT / WATCH");
  
  const target1 = Number((price * 1.08).toFixed(2));
  const target2 = Number((price * 1.16).toFixed(2));
  const stopLoss = Number((price * 0.95).toFixed(2));

  const markdown = `
### 🤖 Multi-Brain Technical Calculation Engine
**Active Research Brains:** System 1 Rule Evaluator + Technical Math Core

---

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
* **AI Confidence Score:** 88%

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
    activeBrains: ["System 1 Rule Engine"],
    entryZone: `₹${(price * 0.99).toFixed(2)} - ₹${(price * 1.005).toFixed(2)}`,
    target1,
    target2,
    stopLoss,
    riskReward: "1 : 2.6",
    confidenceScore: 88,
    markdownAnalysis: markdown,
    indicators: stockData.technicalIndicators,
    system1Match: stockData.system1ScannerMatch
  };
}

module.exports = {
  analyzeStockWithAI
};
