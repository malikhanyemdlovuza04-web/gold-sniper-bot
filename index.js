const express = require("express");
const generateSignal = require("./strategyEngine");

console.log("🔥 BOT STARTING...");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔑 Discord webhook from Railway variables
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

// 🔢 Fake price generator (we upgrade later)
function getFakePrice() {
  return Math.floor(Math.random() * (2400 - 1900 + 1)) + 1900;
}

// 📲 Send to Discord (NO axios needed)
const sendToDiscord = async (message) => {
  try {
    if (!DISCORD_WEBHOOK) {
      console.log("⚠️ No Discord webhook set");
      return;
    }

    await fetch(DISCORD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: message })
    });

    console.log("✅ Sent to Discord");

  } catch (err) {
    console.log("❌ Discord error:", err.message);
  }
};

// 🔁 Bot loop (runs every 10 seconds)
setInterval(async () => {
  try {
    const price = getFakePrice();

    const signalData = generateSignal({
      price: price,
      ema200: price - 2,
      rsi: Math.floor(Math.random() * 100),
      support: price - 5,
      resistance: price + 5,
      mtfTrend: Math.random() > 0.5 ? "UP" : "DOWN"
    });

    console.log("📊 Signal:", signalData.signal);

    if (signalData.signal !== "HOLD") {
      const message = `
🚨 GOLD SNIPER SIGNAL 🚨
Type: ${signalData.signal}
Price: ${signalData.price}
SL: ${signalData.stopLoss}
TP: ${signalData.takeProfit}
Confidence: ${signalData.confidence}%
      `;

      await sendToDiscord(message);
    }

  } catch (err) {
    console.log("❌ Bot loop error:", err.message);
  }
}, 10000);

// 🌐 Routes
app.get("/", (req, res) => {
  res.send("🔥 Gold Sniper Bot Running");
});

app.get("/health", (req, res) => {
  res.send("OK");
});

// 🚀 Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});