function generateSignal(data) {
  let score = 0;

  // 1. Trend (200 EMA)
  if (data.price > data.ema200) {
    score += 2;
    data.trend = "UP";
  } else {
    score += 2;
    data.trend = "DOWN";
  }

  // 2. RSI
  if (data.rsi < 30) score += 2; // oversold → buy
  if (data.rsi > 70) score += 2; // overbought → sell

  // 3. Support/Resistance
  if (Math.abs(data.price - data.support) < 2) score += 2;
  if (Math.abs(data.price - data.resistance) < 2) score += 2;

  // 4. Multi-timeframe agreement
  if (data.mtfTrend === data.trend) score += 2;

  // 🎯 FINAL DECISION
  let signal = "HOLD";

  if (score >= 7 && data.trend === "UP") signal = "BUY";
  if (score >= 7 && data.trend === "DOWN") signal = "SELL";

  // SL & TP
  let stopLoss = signal === "BUY" ? data.price - 5 : data.price + 5;
  let takeProfit = signal === "BUY" ? data.price + 10 : data.price - 10;

  return {
    signal,
    score,
    trend: data.trend,
    stopLoss,
    takeProfit
  };
}

module.exports = generateSignal;