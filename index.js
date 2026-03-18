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

    return parseFloat(data.price);

  } catch (err) {
    console.log("Price error:", err.message);
    return null;
  }
}

// ===== STORAGE =====
let prices = [];

// ===== EMA 50 =====
function calculateEMA() {
  if (prices.length < 50) return null;

  const k = 2 / (50 + 1);
  let ema = prices[0];

  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return ema;
}

// ===== RSI =====
function calculateRSI() {
  if (prices.length < 14) return null;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i < 14; i++) {
    const diff = prices[i] - prices[i - 1];

    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }

  const rs = gains / (losses || 1);
  return 100 - (100 / (1 + rs));
}

// ===== SESSION FILTER =====
function isTradingSession() {
  const hour = new Date().getUTCHours();

  return (
    (hour >= 7 && hour <= 11) || // London
    (hour >= 13 && hour <= 17)   // New York
  );
}

// ===== MOMENTUM =====
function hasMomentum() {
  if (prices.length < 5) return false;

  const recent = prices.slice(-5);
  const move = Math.abs(recent[4] - recent[0]);

  return move > 0.05;
}

// ===== SIGNAL ENGINE =====
function generateSignal(price, rsi, ema) {
  let signal = "HOLD";
  let confidence = 0;

  const trendUp = price > ema;
  const trendDown = price < ema;

  if (trendUp && rsi < 35) {
    signal = "BUY";
    confidence = 85;
  }

  if (trendDown && rsi > 65) {
    signal = "SELL";
    confidence = 85;
  }

  const sl = signal === "BUY"
    ? price - 0.30
    : price + 0.30;

  const tp = signal === "BUY"
    ? price + 0.60
    : price - 0.60;

  return { signal, sl, tp, confidence };
}

// ===== COOLDOWN =====
let lastSignalTime = 0;
const COOLDOWN = 90000;

// ===== BOT LOOP =====
setInterval(async () => {
  const price = await getPrice();
  if (!price) return;

  prices.push(price);
  if (prices.length > 100) prices.shift();

  const ema = calculateEMA();
  const rsi = calculateRSI();

  if (!ema || !rsi) {
    console.log("Collecting data...");
    return;
  }

  if (!isTradingSession()) {
    console.log("Outside session");
    return;
  }

  if (!hasMomentum()) {
    console.log("No momentum");
    return;
  }

  const { signal, sl, tp, confidence } = generateSignal(price, rsi, ema);

  console.log({ price, rsi, ema, signal });

  const now = Date.now();

  if (
    signal !== "HOLD" &&
    confidence > 80 &&
    now - lastSignalTime > COOLDOWN
  ) {
    lastSignalTime = now;

    const message = `
💱 USD/JPY SNIPER PRO 💱
Type: ${signal}
Price: ${price.toFixed(3)}
SL: ${sl.toFixed(3)}
TP: ${tp.toFixed(3)}
RSI: ${rsi.toFixed(2)}
Trend EMA50: ${ema.toFixed(3)}
Session: ACTIVE
Confidence: ${confidence}%
`;

    await sendToDiscord(message);
  }

}, 60000);

// ===== SERVER =====
app.get("/", (req, res) => {
  res.send("🔥 SNIPER BOT RUNNING");
});

app.listen(PORT, async () => {
  console.log("🚀 Bot started");
  await sendToDiscord("🔥 SNIPER BOT LIVE 🔥");
});