import { Telegraf, session } from "telegraf";
import rateLimit from "telegraf-ratelimit";
import {
  startHandler,
  dpHandler,
  postHandler,
  userHandler,
  helpHandler,
} from "./commands.js";
import { parseShortcode, parseUsername } from "./utils.js";

const bot = new Telegraf(process.env.BOT_TOKEN);

// Rate limiting middleware: max 5 requests per 60 seconds
const limitConfig = {
  window: 60000,
  limit: 5,
  onLimitExceeded: (ctx) =>
    ctx.reply("⚠️ Rate limit exceeded. Please wait a minute."),
};

bot.use(session());
bot.use(rateLimit(limitConfig));

// Command Handlers
bot.start(startHandler);
bot.help(helpHandler);

bot.command("dp", (ctx) => {
  const arg = ctx.message.text.split(" ")[1];
  dpHandler(ctx, arg);
});

bot.command("post", (ctx) => {
  const arg = ctx.message.text.split(" ")[1];
  postHandler(ctx, arg);
});

bot.command("user", (ctx) => {
  const arg = ctx.message.text.split(" ")[1];
  userHandler(ctx, arg);
});

// Text listener for automatic processing
bot.on("text", (ctx) => {
  const text = ctx.message.text;
  if (parseShortcode(text)) {
    return postHandler(ctx, text);
  }
  if (text.startsWith("@")) {
    return dpHandler(ctx, text);
  }
});

// Callback query for "Download More" button
bot.action("help", helpHandler);

export default bot;
