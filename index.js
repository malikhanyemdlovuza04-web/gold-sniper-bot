const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;

function randomPrice() {
  return (5170 + Math.random()).toFixed(2);
}

function calculateEMA(price) {
  return price - 0.20 + Math.random() * 0.40;
}

function detectTrend(price, ema) {
  if (price > ema) return "Bullish";
  if (price < ema) return "Bearish";
  return "Neutral";
}

function liquiditySweep() {
  const sweeps = ["None", "Buy-side liquidity taken", "Sell-side liquidity taken"];
  return sweeps[Math.floor(Math.random() * sweeps.length)];
}

function tradingSignal(trend, rsi) {
  if (trend === "Bullish" && rsi < 65) return "BUY";
  if (trend === "Bearish" && rsi > 35) return "SELL";
  return "HOLD";
}

function stopLoss(price, signal) {
  if (signal === "BUY") return (price - 1.5).toFixed(2);
  if (signal === "SELL") return (price + 1.5).toFixed(2);
  return null;
}

function takeProfit(price, signal) {
  if (signal === "BUY") return (price + 3).toFixed(2);
  if (signal === "SELL") return (price - 3).toFixed(2);
  return null;
}

function generateSignal() {

  const price = parseFloat(randomPrice());

  const ema200 = calculateEMA(price);

  const trend = detectTrend(price, ema200);

  const rsi = (40 + Math.random() * 30).toFixed(2);

  const atr = (0.05 + Math.random() * 0.20).toFixed(2);

  const support = (price - 0.20).toFixed(2);

  const resistance = (price + 0.20).toFixed(2);

  const sweep = liquiditySweep();

  const signal = tradingSignal(trend, rsi);

  const sl = stopLoss(price, signal);

  const tp = takeProfit(price, signal);

  return {
    symbol: "XAU/USD",
    price: price,
    ema200: ema200.toFixed(2),
    trend: trend,
    signal: signal,
    rsi: rsi,
    atr: atr,
    support: support,
    resistance: resistance,
    liquidity_sweep: sweep,
    stop_loss: sl,
    take_profit: tp,
    confidence: Math.floor(Math.random() * 40 + 60) + "%"
  };
}

app.get("/", (req, res) => {
  res.send("Gold Sniper Bot running");
});

app.get("/api/signal", (req, res) => {

  const signal = generateSignal();

  res.json(signal);

});

app.listen(PORT, () => {
  console.log(`Gold Sniper Bot running on port ${PORT}`);
});
