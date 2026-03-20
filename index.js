const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;
const API_KEY = process.env.TWELVE_API_KEY;

// ===== DISCORD =====
async function sendToDiscord(message) {
  try {
    if (!DISCORD_WEBHOOK) return;

    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message })
    });
  } catch (err) {
    console.log("Discord error:", err.message);
  }
}

// ===== GET PRICE =====
async function getPrice() {
  try {
    const res = await fetch(
      `https://api.twelvedata.com/price?symbol=USD/JPY&apikey=${API_KEY}`
    );
    const data = await res.json();

    if (!data.price) return null;
    return parseFloat(data.price);

  } catch (err) {
    console.log("Price error:", err.message);
    return null;
  }
}

// ===== STORAGE =====
let prices = [];

// ===== EMA =====
function EMA(period) {
  if (prices.length < period) return null;

  const k = 2 / (period + 1);
  let ema = prices[prices.length - period];

  for (let i = prices.length - period + 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return ema;
}

// ===== RSI =====
function RSI() {
  if (prices.length < 14) return null;

  let gains = 0;
  let losses = 0;

  for (let i = prices.length - 14; i < prices.length - 1; i++) {
    const diff = prices[i + 1] - prices[i];

    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }

  const rs = gains / (losses || 1);
  return 100 - (100 / (1 + rs));
}

// ===== MOMENTUM =====
function momentum() {
  if (prices.length < 6) return false;

  const move = Math.abs(prices.at(-1) - prices.at(-6));
  return move > 0.02;
}

// ===== LIQUIDITY SWEEP (BASIC) =====
function liquiditySweep() {
  if (prices.length < 10) return false;

  const recentHigh = Math.max(...prices.slice(-10));
  const recentLow = Math.min(...prices.slice(-10));
  const current = prices.at(-1);

  return current >= recentHigh || current <= recentLow;
}

// ===== BREAK OF STRUCTURE (SIMULATED) =====
function breakOfStructure() {
  if (prices.length < 10) return null;

  const prevHigh = Math.max(...prices.slice(-10, -5));
  const prevLow = Math.min(...prices.slice(-10, -5));
  const current = prices.at(-1);

  if (current > prevHigh) return "BULLISH";
  if (current < prevLow) return "BEARISH";

  return null;
}

// ===== SIGNAL ENGINE =====
function generateSignal(price, rsi, ema50, ema200) {
  let score = 0;
  let reasons = [];

  const trendUp = ema50 > ema200;
  const trendDown = ema50 < ema200;

  if (trendUp) {
    score += 2;
    reasons.push("Uptrend");
  }

  if (trendDown) {
    score += 2;
    reasons.push("Downtrend");
  }

  if (rsi < 40 && trendUp) {
    score += 2;
    reasons.push("RSI Oversold");
  }

  if (rsi > 60 && trendDown) {
    score += 2;
    reasons.push("RSI Overbought");
  }

  if (momentum()) {
    score += 1;
    reasons.push("Momentum");
  }

  const bos = breakOfStructure();
  if (bos) {
    score += 2;
    reasons.push("BOS " + bos);
  }

  if (liquiditySweep()) {
    score += 1;
    reasons.push("Liquidity Sweep");
  }

  let signal = "HOLD";

  if (score >= 6 && trendUp) signal = "BUY";
  if (score >= 6 && trendDown) signal = "SELL";

  const sl = signal === "BUY" ? price - 0.30 : price + 0.30;
  const tp = signal === "BUY" ? price + 0.80 : price - 0.80;

  let grade = "C";
  if (score >= 7) grade = "A+";
  else if (score >= 6) grade = "A";
  else if (score >= 5) grade = "B";

  return { signal, sl, tp, score, grade, reasons };
}

// ===== COOLDOWN =====
let lastSignalTime = 0;
const COOLDOWN = 120000;

// ===== LOOP =====
setInterval(async () => {
  const price = await getPrice();
  if (!price) return;

  prices.push(price);
  if (prices.length > 200) prices.shift();

  const ema50 = EMA(50);
  const ema200 = EMA(200);
  const rsi = RSI();

  if (!ema50 || !ema200 || !rsi) {
    console.log("Collecting data...");
    return;
  }

  const { signal, sl, tp, score, grade, reasons } =
    generateSignal(price, rsi, ema50, ema200);

  console.log({ price, rsi, ema50, ema200, signal, score });

  const now = Date.now();

  if (signal !== "HOLD" && score >= 6 && now - lastSignalTime > COOLDOWN) {
    lastSignalTime = now;

    const message = `
🔥 USDJPY SMC ELITE 🔥
Type: ${signal}
Price: ${price.toFixed(3)}
SL: ${sl.toFixed(3)}
TP: ${tp.toFixed(3)}
Score: ${score}
Grade: ${grade}
RSI: ${rsi.toFixed(2)}
EMA50: ${ema50.toFixed(3)}
EMA200: ${ema200.toFixed(3)}

Confluence:
- ${reasons.join("\n- ")}
`;

    await sendToDiscord(message);
  }

}, 60000);

// ===== SERVER =====
app.get("/", (req, res) => {
  res.send("🔥 SMC ELITE BOT RUNNING");
});

app.listen(PORT, async () => {
  console.log("🚀 SMC BOT STARTED");
  await sendToDiscord("🔥 SMC ELITE BOT LIVE 🔥");
});