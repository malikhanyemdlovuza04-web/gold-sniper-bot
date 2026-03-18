const express = require("express");

console.log("🔥 GOLD SNIPER BOT STARTING...");

const app = express();
const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

let prices = [];

// 📊 Simulated price
function getPrice() {
  let last = prices.length ? prices[prices.length - 1] : 2000;
  let newPrice = last + (Math.random() - 0.5) * 6;
  prices.push(newPrice);

  if (prices.length > 100) prices.shift();
  return newPrice;
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

// 📉 RSI (looser)
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

// 📊 Fake MTF trend
function getMTFTrend() {
  return Math.random() > 0.5 ? "UP" : "DOWN";
}

// 📲 Discord sender
async function sendToDiscord(message) {
  try {
    if (!DISCORD_WEBHOOK) return;

    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message })
    });

    console.log("✅ Sent to Discord");
  } catch (err) {
    console.log("❌ Discord error:", err.message);
  }
}

// 🔁 BOT LOOP
let latestSignal = null;

setInterval(async () => {
  try {
    const price = getPrice();

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

    // 🔥 Looser RSI
    if (rsi < 40 || rsi > 60) score += 2;

    // MTF alignment
    if (mtf1 === trend) score++;
    if (mtf15 === trend) score++;
    if (mtf1h === trend) score++;

    // Liquidity
    if (sweep !== "NONE") score += 2;

    let signal = "HOLD";

    // 🔥 LOWERED threshold
    if (score >= 4 && trend === "UP") signal = "BUY";
    if (score >= 4 && trend === "DOWN") signal = "SELL";

    let stopLoss = signal === "BUY" ? price - atr * 2 : price + atr * 2;
    let takeProfit = signal === "BUY" ? price + atr * 4 : price - atr * 4;

    let confidence = Math.min(score * 12, 95);

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

    if (signal !== "HOLD" && confidence >= 50) {
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
}, 3000); // 🔥 Faster

// 🌐 Routes
app.get("/", (req, res) => {
  res.send("🔥 Gold Sniper Bot Running");
});

app.get("/dashboard", (req, res) => {
  res.json(latestSignal || { status: "waiting..." });
});

app.get("/health", (req, res) => res.send("OK"));

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});