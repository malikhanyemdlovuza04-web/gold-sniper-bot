const express = require("express");
const cors = require("cors");

const { generateSignal } = require("./strategyEngine");
const { getMarketPrice, getSupport, getResistance, getSession } = require("./marketData");
const sendDiscordAlert = require("./discord");

const app = express();
app.use(cors());

// Store latest signal
let latestSignal = null;

// 🔁 AUTO SCANNER (runs every 5 seconds)
setInterval(() => {

  const price = getMarketPrice();

  const signalData = generateSignal(price);

  const support = getSupport(price);
  const resistance = getResistance(price);
  const session = getSession();

  latestSignal = {
    symbol: "XAU/USD",
    price,
    session,
    support,
    resistance,
    ...signalData
  };

  console.log("📊 New Signal:", latestSignal);

  // 🔥 DISCORD ALERT (TEST MODE: more frequent)
  if (latestSignal.signal !== "HOLD" && parseInt(latestSignal.confidence) > 50) {

    sendDiscordAlert({
      signal: latestSignal.signal,
      price: latestSignal.price,
      trend: latestSignal.trend,
      rsi: latestSignal.rsi,
      support: latestSignal.support,
      resistance: latestSignal.resistance,
      stopLoss: latestSignal.stop_loss,
      takeProfit: latestSignal.take_profit,
      confidence: parseInt(latestSignal.confidence)
    });

  }

}, 5000);

// API route
app.get("/api/signal", (req, res) => {

  if (!latestSignal) {
    return res.json({ error: "No market data yet" });
  }

  res.json(latestSignal);

});

// Dashboard route
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/dashboard.html");
});

// ✅ Railway port fix
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Gold Sniper Bot running on port " + PORT);
});