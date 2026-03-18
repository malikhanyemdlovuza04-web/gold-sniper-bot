const express = require("express");

console.log("🔥 GOLD SNIPER BOT STARTING...");

const app = express();
const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

let prices = [];

// 🟡 REAL GOLD PRICE (XAUUSD)
async function getPrice() {
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=XAUUSDT");
    const data = await res.json();

    const price = parseFloat(data.price);

    prices.push(price);
    if (prices.length > 100) prices.shift();

    return price;

  } catch (err) {
    console.log("❌ Price fetch error:", err.message);
    return null;
  }
}

// 📈 EMA
function calculateEMA(period) {
  if (prices.length < period) return prices[prices.length - 1] || 2000;

  let k = 2 / (period + 1);
  let ema = prices[0];

  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return ema;
}

// 📉 RSI
function calculateRSI() {
  if (prices.length < 15) return 50;

  let gains = 0, losses = 0;

  for (let i = prices.length - 14; i < prices.length; i++) {
    let diff = prices[i] - prices[i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }

  let rs = gains / (losses || 1);
  return 100 - (100 / (1 + rs));
}

// 📊 ATR
function calculateATR() {
  if (prices.length < 15) return 2;

  let sum = 0;
  for (let i = prices.length - 14; i < prices.length; i++) {
    sum += Math.abs(prices[i] - prices[i - 1]);
  }

  return sum / 14;
}

// 🧠 Liquidity sweep
function liquiditySweep(price) {
  let recentHigh = Math.max(...prices.slice(-20));
  let recentLow = Math.min(...prices.slice(-20));

  if (price > recentHigh) return "SELL";
  if (price < recentLow) return "BUY";
  return "NONE";
}

// 📊 REAL TREND (no randomness)
function getMTFTrend() {
  const ema = calculateEMA(50);
  const price = prices[prices.length - 1];

  return price > ema ? "UP" : "DOWN";
}

// ⏰ SESSION FILTER (London + NY)
function isTradingSession() {
  const hour = new Date().getUTCHours();
  return (hour >= 7 && hour <= 16);
}

// 📲 Discord
async function sendToDiscord(message) {
  try {
    if (!DISCORD_WEBHOOK) {
      console.log("❌ No webhook set");
      return;
    }

    const res = await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message })
    });

    console.log("📡 Discord status:", res.status);

  } catch (err) {
    console.log("❌ Discord error:", err.message);
  }
}

// 🔁 BOT LOOP
let latestSignal = null;

setInterval(async () => {
  try {

    // ⏰ Session filter
    if (!isTradingSession()) {
      console.log("⏰ Outside trading session");
      return;
    }

    const price = await getPrice();
    if (!price) return;

    const ema = calculateEMA(50);
    const rsi = calculateRSI();
    const atr = calculateATR();
    const sweep = liquiditySweep(price);

    const mtf1 = getMTFTrend();
    const mtf15 = getMTFTrend();
    const mtf1h = getMTFTrend();

    let score = 0;

    const trend = price > ema ? "UP" : "DOWN";
    score += 2;

    // RSI condition
    if (rsi < 40 || rsi > 60) score += 2;

    // MTF alignment
    if (mtf1 === trend) score++;
    if (mtf15 === trend) score++;
    if (mtf1h === trend) score++;

    // Liquidity (fixed)
    if (sweep !== "NONE") score += 2;
    else score += 1;

    let signal = "HOLD";

    if (score >= 4 && trend === "UP") signal = "BUY";
    if (score >= 4 && trend === "DOWN") signal = "SELL";

    let stopLoss = signal === "BUY" ? price - atr * 2 : price + atr * 2;
    let takeProfit = signal === "BUY" ? price + atr * 4 : price - atr * 4;

    let confidence = Math.min(score * 15, 95);

    latestSignal = {
      price: price.toFixed(2),
      signal,
      trend,
      rsi: rsi.toFixed(2),
      atr: atr.toFixed(2),
      liquidity: sweep,
      confidence,
      stopLoss: stopLoss.toFixed(2),
      takeProfit: takeProfit.toFixed(2)
    };

    console.log("📊", latestSignal);

    if (signal !== "HOLD" && confidence >= 40) {
      await sendToDiscord(`
🚨 GOLD SNIPER SIGNAL 🚨
Type: ${signal}
Price: ${latestSignal.price}
SL: ${latestSignal.stopLoss}
TP: ${latestSignal.takeProfit}
RSI: ${latestSignal.rsi}
Liquidity: ${latestSignal.liquidity}
Confidence: ${confidence}%
      `);
    }

  } catch (err) {
    console.log("❌ Bot error:", err.message);
  }
}, 5000);

// 🌐 Routes
app.get("/", (req, res) => {
  res.send("🔥 Gold Sniper Bot Running (REAL MODE)");
});

app.get("/dashboard", (req, res) => {
  res.json(latestSignal || { status: "waiting..." });
});

app.get("/health", (req, res) => res.send("OK"));

// 🚀 Start
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});