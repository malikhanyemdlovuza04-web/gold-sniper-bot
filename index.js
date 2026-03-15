const express = require("express");
const cors = require("cors");

const { generateSignal } = require("./strategyEngine");
const market = require("./marketData");

const app = express();

app.use(cors());
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;


/* ROOT */
app.get("/", (req,res)=>{
res.sendFile(__dirname + "/dashboard.html");
});


/* SIGNAL API */
app.get("/api/signal",(req,res)=>{

const price = market.getMarketPrice();

const signalData = generateSignal(price);

const support = market.getSupport(price);
const resistance = market.getResistance(price);
const session = market.getSession();

res.json({

symbol:"XAU/USD",

price:price,

session:session,

trend:signalData.trend,

trend_1m:signalData.trend1m,
trend_15m:signalData.trend15m,
trend_1h:signalData.trend1h,

rsi:signalData.rsi,

ema200:signalData.ema200,

volatility_spike:signalData.volatility_spike,

liquidity_sweep:signalData.liquidity_sweep,

support:support,
resistance:resistance,

signal:signalData.signal,

stop_loss:signalData.stop_loss,
take_profit:signalData.take_profit,

confidence:signalData.confidence

});

});


app.listen(PORT,()=>{

console.log("Gold Sniper Bot running on port "+PORT);

});
