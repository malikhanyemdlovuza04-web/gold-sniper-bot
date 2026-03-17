const express = require("express");
const axios = require("axios");
const generateSignal = require("./strategyEngine");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 Replace with your Railway env variable
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

// Fake price generator (we upgrade later to real market data)
function getFakePrice() {
  return Math.floor(Math.random() * (2400 - 1900 + 1)) + 1900;
}

// Send message to Discord
async function sendToDiscord(message) {
  try {
    if (!DISCORD_WEBHOOK) {
      console.log("⚠️ No Discord webhook set");
      return;
    }

    await axios.post(DISCORD_WEBHOOK, {
      content: message,
    });

  } catch (err) {
    console.log("Discord error:", err.message);
  }
}

// Bot loop
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
🚨 TRADE SIGNAL 🚨
Type: ${signalData.signal}
Price: ${signalData.price}
SL: ${signalData.stopLoss}
TP: ${signalData.takeProfit}
Confidence: ${signalData.confidence}%
      `;

      await sendToDiscord(message);
    }

  } catch (err) {
    console.log("Bot loop error:", err.message);
  }
}, 10000);

// Root route (so Railway shows something)
app.get("/", (req, res) => {
  res.send("🔥 Gold Sniper Bot Running");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});