/**
 * Portfolio & Exit Strategy Service
 * Tracks user holdings and triggers automated Exit / Trailing Stop-Loss notifications
 */

function evaluatePortfolioAlerts(holdings = [], liveQuotes = {}) {
  const alerts = [];

  holdings.forEach(item => {
    const symbol = item.symbol.toUpperCase();
    const buyPrice = Number(item.buyPrice);
    const qty = Number(item.qty || 1);
    const target1 = Number(item.target1 || buyPrice * 1.08); // default +8%
    const target2 = Number(item.target2 || buyPrice * 1.18); // default +18%
    const stopLoss = Number(item.stopLoss || buyPrice * 0.95); // default -5%

    const currentQuote = liveQuotes[symbol] || { price: buyPrice * 1.02 };
    const currentPrice = currentQuote.price;
    const pnl = (currentPrice - buyPrice) * qty;
    const pnlPercent = ((currentPrice - buyPrice) / buyPrice) * 100;

    let status = "HOLDING";
    let alertMessage = null;
    let badgeColor = "BLUE";

    // 1. Target 2 Hit (Final Profit Target)
    if (currentPrice >= target2) {
      status = "TARGET 2 HIT - FULL PROFIT BOOKING";
      alertMessage = `🚀 **Target 2 Hit for ${symbol}!** Current Price ₹${currentPrice} (Bought @ ₹${buyPrice}, +${pnlPercent.toFixed(1)}%). Consider booking 100% profits now!`;
      badgeColor = "GREEN";
    }
    // 2. Target 1 Hit (Partial Profit Booking + Trailing SL)
    else if (currentPrice >= target1) {
      status = "TARGET 1 HIT - PARTIAL EXIT & TRAIL SL";
      alertMessage = `🎯 **Target 1 Hit for ${symbol}!** Price ₹${currentPrice} (+${pnlPercent.toFixed(1)}%). Book 50% profits & move Stop-Loss to Cost Price (₹${buyPrice}) to guarantee ZERO loss!`;
      badgeColor = "GREEN";
    }
    // 3. Stop-Loss Hit (Exit Trigger)
    else if (currentPrice <= stopLoss) {
      status = "STOP LOSS TRIGGERED - EXIT";
      alertMessage = `🛑 **Stop Loss Hit for ${symbol}!** Price ₹${currentPrice} (SL @ ₹${stopLoss}). Exit position to protect capital!`;
      badgeColor = "RED";
    }

    if (alertMessage) {
      alerts.push({
        id: item.id || Date.now() + Math.random(),
        symbol,
        buyPrice,
        currentPrice,
        pnl: Number(pnl.toFixed(2)),
        pnlPercent: Number(pnlPercent.toFixed(2)),
        status,
        alertMessage,
        badgeColor
      });
    }
  });

  return alerts;
}

module.exports = {
  evaluatePortfolioAlerts
};
