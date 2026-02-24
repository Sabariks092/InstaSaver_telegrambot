const TelegramBot = require("node-telegram-bot-api");
const instaScrapper = require("./insta");
require("dotenv").config();

const token = process.env.TELEGRAM_API;
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
  const welcome = `
🤖 *Welcome to InstaSaver Bot!*
I can help you download Instagram content.

*Commands:*
👤 \`/dp @username\` - Download profile picture
📷 \`/stories @username\` - Download stories
🔗 Just paste any Instagram link (Post/Reel)

_Note: Only works for public accounts._
  `;
  bot.sendMessage(msg.chat.id, welcome, { parse_mode: "Markdown" });
});

bot.onText(/\/dp (.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const username = match[1].replace("@", "").trim();
  bot.sendMessage(chatId, `⏳ Fetching DP for @${username}...`);

  try {
    const data = await instaScrapper.getProfileInfo(username);
    const dp = data.profile_pic_url_hd || data.profile_pic_url;
    if (dp) {
      bot.sendPhoto(chatId, dp, {
        caption: `✅ Profile Picture of @${username}`,
      });
    } else {
      bot.sendMessage(chatId, "❌ Could not find profile picture.");
    }
  } catch (err) {
    bot.sendMessage(chatId, `❌ Error: ${err.message}`);
  }
});

bot.onText(/\/stories (.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const username = match[1].replace("@", "").trim();
  bot.sendMessage(chatId, `⏳ Fetching stories for @${username}...`);

  try {
    const stories = await instaScrapper.getStories(username);
    if (stories.length > 0) {
      for (const item of stories) {
        const url = item.video_url || item.image_url || item.display_url;
        if (item.is_video) bot.sendVideo(chatId, url);
        else bot.sendPhoto(chatId, url);
      }
    } else {
      bot.sendMessage(chatId, "📭 No active stories found.");
    }
  } catch (err) {
    bot.sendMessage(chatId, `❌ Error: ${err.message}`);
  }
});

bot.on("message", async (msg) => {
  if (msg.text && msg.text.includes("instagram.com/")) {
    if (
      msg.text === "/start" ||
      msg.text.startsWith("/dp") ||
      msg.text.startsWith("/stories")
    )
      return;

    const chatId = msg.chat.id;
    bot.sendMessage(chatId, "⏳ Processing your link...");

    try {
      const medias = await instaScrapper.getPostMedia(msg.text);
      if (medias && medias.length > 0) {
        for (const media of medias) {
          if (media.type === "video") bot.sendVideo(chatId, media.link);
          else bot.sendPhoto(chatId, media.link);
        }
      } else {
        bot.sendMessage(chatId, "❌ Could not find media for this link.");
      }
    } catch (err) {
      bot.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
  }
});

module.exports = bot;
