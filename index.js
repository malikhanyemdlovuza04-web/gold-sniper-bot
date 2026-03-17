const express = require("express");
const cors = require("cors");

const { generateSignal } = require("./strategyEngine");
const { getMarketPrice, getSupport, getResistance, getSession } = require("./marketData");

const app = express();
app.use(cors());

// Store latest signal
let latestSignal = null;

// Generate signal every 5 seconds
setInterval(() => {
  const price = getMarketPrice();

  const signalData = generateSignal(price);

  latestSignal = {
    symbol: "XAU/USD",
    price: price,
    session: getSession(),
    support: getSupport(price),
    resistance: getResistance(price),
    ...signalData
  };

  console.log("New Signal:", latestSignal);

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

// ✅ IMPORTANT: Railway Port Fix
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Gold Sniper Bot running on port " + PORT);
});