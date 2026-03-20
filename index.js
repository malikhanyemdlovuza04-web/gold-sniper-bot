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

    if (!data.price) {
      console.log("No price from API:", data);
      return null;
    }

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

// ===== FORCE SIGNAL ENGINE =====
function generateSignal(price, rsi, ema50, ema200) {
  let signal;
  let reasons = ["Test Mode Active"];

  // 🔥 FORCE SIGNAL EVERY TIME
  if (rsi < 50) {
    signal = "BUY";
    reasons.push("RSI < 50");
  } else {
    signal = "SELL";
    reasons.push("RSI >= 50");
  }

  const sl = signal === "BUY" ? price - 0.30 : price + 0.30;
  const tp = signal === "BUY" ? price + 0.60 : price - 0.60;

  return {
    signal,
    sl,
    tp,
    score: 5,
    grade: "TEST",
    reasons
  };
}

// ===== LOOP =====
setInterval(async () => {
  const price = await getPrice();
  if (!price) return;

  prices.push(price);
  if (prices.length > 200) prices.shift();

  const ema50 = EMA(50);
  const ema200 = EMA(200);
  const rsi = RSI();

  // ===== DEBUG MESSAGE =====
  console.log("DEBUG:", { price, rsi });

  await sendToDiscord(`📊 DEBUG: Price ${price} | RSI ${rsi ? rsi.toFixed(2) : "N/A"}`);

  if (!ema50 || !ema200 || !rsi) {
    console.log("Collecting data...");
    return;
  }

  const { signal, sl, tp, score, grade, reasons } =
    generateSignal(price, rsi, ema50, ema200);

  console.log({ price, signal });

  // ===== FORCE SEND SIGNAL =====
  const message = `
🔥 TEST SIGNAL MODE 🔥
Type: ${signal}
Price: ${price.toFixed(3)}
SL: ${sl.toFixed(3)}
TP: ${tp.toFixed(3)}
RSI: ${rsi.toFixed(2)}

Reason:
- ${reasons.join("\n- ")}
`;

  await sendToDiscord(message);

}, 60000);

// ===== SERVER =====
app.get("/", (req, res) => {
  res.send("🔥 DEBUG BOT RUNNING");
});

app.listen(PORT, async () => {
  console.log("🚀 DEBUG BOT STARTED");
  await sendToDiscord("🔥 DEBUG MODE LIVE 🔥");
});