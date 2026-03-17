const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const sendDiscordAlert = async (data) => {
  try {
    const webhook = process.env.DISCORD_WEBHOOK_URL;

    if (!webhook) {
      console.log("❌ No Discord webhook set");
      return;
    }

    const message = {
      content: `🚨 GOLD SNIPER ALERT 🚨
Signal: ${data.signal}
Price: ${data.price}
Trend: ${data.trend}
RSI: ${data.rsi}
Support: ${data.support}
Resistance: ${data.resistance}
SL: ${data.stopLoss}
TP: ${data.takeProfit}
Confidence: ${data.confidence}%`
    };

    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(message)
    });

    console.log("✅ Sent to Discord");

  } catch (err) {
    console.log("❌ Discord error:", err.message);
  }
};

module.exports = sendDiscordAlert;