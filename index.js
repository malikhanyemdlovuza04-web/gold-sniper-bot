const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

// 🔥 ENV VARIABLE
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK;

// 🔥 SEND TO DISCORD FUNCTION
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

    console.log("📡 Discord response:", res.status);

  } catch (err) {
    console.log("❌ Discord error:", err.message);
  }
}

// 🔥 FAKE MARKET PRICE (for now stable)
function getPrice() {
  return (1900 + Math.random() * 100).toFixed(2);
}

// 🔥 SIGNAL GENERATOR (UPGRADED)
function generateSignal(price) {
  const rsi = Math.random() * 100;
  const liquidity = Math.random() > 0.5 ? "HIGH" : "LOW";

  let signal = "HOLD";
  let confidence = 50;

  if (rsi > 60) {
    signal = "SELL";
    confidence = 70 + Math.random() * 30;
  } else if (rsi < 40) {
    signal = "BUY";
    confidence = 70 + Math.random() * 30;
  }

  const sl = signal === "BUY"
    ? (price - 3).toFixed(2)
    : (parseFloat(price) + 3).toFixed(2);

  const tp = signal === "BUY"
    ? (parseFloat(price) + 6).toFixed(2)
    : (price - 6).toFixed(2);

  return {
    signal,
    price,
    sl,
    tp,
    rsi: rsi.toFixed(2),
    liquidity,
    confidence: Math.floor(confidence)
  };
}

// 🔥 BOT LOOP
setInterval(async () => {
  const price = getPrice();
  const data = generateSignal(parseFloat(price));

  console.log("📊 Signal:", data);

  if (data.signal !== "HOLD") {
    const message = `
🚨 GOLD SNIPER SIGNAL 🚨
Type: ${data.signal}
Price: ${data.price}
SL: ${data.sl}
TP: ${data.tp}
RSI: ${data.rsi}
Liquidity: ${data.liquidity}
Confidence: ${data.confidence}%
`;

    await sendToDiscord(message);
  }

}, 10000); // every 10 sec

// 🔥 WEB ROUTE
app.get("/", (req, res) => {
  res.send("🔥 Gold Sniper Bot Running...");
});

// 🔥 START SERVER + TEST MESSAGE
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  await sendToDiscord("🔥 BOT STARTED TEST MESSAGE 🔥");
});