import "dotenv/config";
import express from "express";
import bot from "./bot/index.js";

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL;

// Middleware
app.use(express.json());

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", bot: "InstaSaver" });
});

// Bot Webhook / Long Polling
if (WEBHOOK_URL) {
  bot.telegram.setWebhook(`${WEBHOOK_URL}/bot${process.env.BOT_TOKEN}`);
  app.use(bot.webhookCallback(`/bot${process.env.BOT_TOKEN}`));
  console.log(`Bot is running on Webhook: ${WEBHOOK_URL}`);
} else {
  bot.launch();
  console.log("Bot is running on Long Polling...");
}

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
