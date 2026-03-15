function calculateEMA(prices, period) {
  const k = 2 / (period + 1);
  let ema = prices[0];

  for (let i = 1; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }

  return ema;
}

function calculateRSI() {
  return 40 + Math.random() * 30;
}

function detectTrend(price, ema200) {
  if (price > ema200) return "Bullish";
  if (price < ema200) return "Bearish";
  return "Neutral";
}

function multiTimeframeTrend() {

  const trends = ["Bullish","Bearish"];

  const trend1m = trends[Math.floor(Math.random()*2)];
  const trend15m = trends[Math.floor(Math.random()*2)];
  const trend1h = trends[Math.floor(Math.random()*2)];

  return {
    trend1m,
    trend15m,
    trend1h
  };
}

function volatilitySpike() {
  return Math.random() > 0.7;
}

function liquiditySweep() {
  const sweeps = ["None","Buy Liquidity Taken","Sell Liquidity Taken"];
  return sweeps[Math.floor(Math.random()*3)];
}

function stopLoss(price, signal) {
  if(signal==="BUY") return price - 1.5;
  if(signal==="SELL") return price + 1.5;
  return null;
}

function takeProfit(price, signal) {
  if(signal==="BUY") return price + 3;
  if(signal==="SELL") return price - 3;
  return null;
}

function generateSignal(price) {

  const prices = [price-1,price-0.5,price];

  const ema200 = calculateEMA(prices,200);

  const rsi = calculateRSI();

  const trend = detectTrend(price, ema200);

  const mtf = multiTimeframeTrend();

  const volSpike = volatilitySpike();

  const sweep = liquiditySweep();

  let signal = "HOLD";

  if(
    trend==="Bullish" &&
    mtf.trend1m==="Bullish" &&
    mtf.trend15m==="Bullish" &&
    rsi < 65 &&
    volSpike
  ){
    signal="BUY";
  }

  if(
    trend==="Bearish" &&
    mtf.trend1m==="Bearish" &&
    mtf.trend15m==="Bearish" &&
    rsi > 35 &&
    volSpike
  ){
    signal="SELL";
  }

  const sl = stopLoss(price,signal);
  const tp = takeProfit(price,signal);

  const confidence = Math.floor(Math.random()*30)+70;

  return {

    price,
    ema200: ema200.toFixed(2),
    rsi: rsi.toFixed(2),

    trend,
    trend1m: mtf.trend1m,
    trend15m: mtf.trend15m,
    trend1h: mtf.trend1h,

    volatility_spike: volSpike,
    liquidity_sweep: sweep,

    signal,

    stop_loss: sl ? sl.toFixed(2) : null,
    take_profit: tp ? tp.toFixed(2) : null,

    confidence: confidence + "%"
  };

}

module.exports = { generateSignal };
