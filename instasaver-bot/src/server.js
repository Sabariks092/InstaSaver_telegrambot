import "dotenv/config";
import express from "express";
import bot from "./bot/telegram.js";

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;
const TOKEN = process.env.BOT_TOKEN;

// Middleware
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", bot: "InstaSaver" });
});

/**
 * Configure Bot (Webhook vs Polling)
 */
if (WEBHOOK_URL) {
  const webhookPath = `/bot/${TOKEN}`;
  bot.setWebHook(`${WEBHOOK_URL}${webhookPath}`);

  // Webhook endpoint
  app.post(webhookPath, (req, res) => {
    bot.processUpdate(req.body);
    res.sendStatus(200);
  });

  console.log(`✅ Bot is running on Webhook: ${WEBHOOK_URL}`);
} else {
  // Polling mode is already started in bot/telegram.js constructor
  console.log("✅ Bot is running on Long Polling...");
}

app.listen(PORT, () => {
  console.log(`🚀 Server is listening on port ${PORT}`);
});
