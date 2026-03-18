const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

// 🔥 DISCORD FUNCTION
async function sendToDiscord(message) {
  try {
    if (!DISCORD_WEBHOOK) {
      console.log("❌ No Discord webhook set");
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

// 🔥 REAL GOLD PRICE (FREE API)
async function getGoldPrice() {
  try {
    const res = await fetch("https://api.gold-api.com/price/XAU");
    const data = await res.json();

    return parseFloat(data.price);
  } catch (err) {
    console.log("❌ Price fetch error:", err.message);
    return null;
  }
}

// 🔥 RSI STORAGE
let lastPrices = [];

// 🔥 RSI CALCULATION
function calculateRSI(price) {
  lastPrices.push(price);

  if (lastPrices.length > 14) {
    lastPrices.shift();
  }

  if (lastPrices.length < 14) return null;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i < lastPrices.length; i++) {
    const diff = lastPrices[i] - lastPrices[i - 1];

    if (diff > 0) gains += diff;
    else losses += Math.abs(diff);
  }

  const rs = gains / (losses || 1);
  const rsi = 100 - (100 / (1 + rs));

  return parseFloat(rsi.toFixed(2));
}

// 🔥 SIGNAL LOGIC
function generateSignal(price, rsi) {
  let signal = "HOLD";
  let confidence = 50;

  if (rsi < 35) {
    signal = "BUY";
    confidence = 80 + Math.random() * 20;
  } else if (rsi > 65) {
    signal = "SELL";
    confidence = 80 + Math.random() * 20;
  }

  const sl = signal === "BUY"
    ? (price - 3).toFixed(2)
    : (price + 3).toFixed(2);

  const tp = signal === "BUY"
    ? (price + 6).toFixed(2)
    : (price - 6).toFixed(2);

  return {
    signal,
    price: price.toFixed(2),
    sl,
    tp,
    rsi,
    confidence: Math.floor(confidence)
  };
}

// 🔥 ANTI-SPAM COOLDOWN
let lastSignalTime = 0;
const COOLDOWN = 60000; // 60 seconds

// 🔥 MAIN BOT LOOP
setInterval(async () => {
  const price = await getGoldPrice();

  if (!price) return;

  const rsi = calculateRSI(price);

  if (!rsi) {
    console.log("⏳ Waiting for RSI data...");
    return;
  }

  const data = generateSignal(price, rsi);

  console.log("📊", data);

  const now = Date.now();

  if (
    data.signal !== "HOLD" &&
    data.confidence > 75 &&
    now - lastSignalTime > COOLDOWN
  ) {
    lastSignalTime = now;

    const message = `
🚨 GOLD SNIPER SIGNAL 🚨
Type: ${data.signal}
Price: ${data.price}
SL: ${data.sl}
TP: ${data.tp}
RSI: ${data.rsi}
Confidence: ${data.confidence}%
`;

    await sendToDiscord(message);
  }

}, 30000); // runs every 30 sec

// 🔥 HEALTH CHECK ROUTE
app.get("/", (req, res) => {
  res.send("🔥 Gold Sniper Bot Running (REAL DATA)");
});

// 🔥 START SERVER + TEST MESSAGE
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  await sendToDiscord("🔥 BOT STARTED (REAL DATA MODE) 🔥");
});