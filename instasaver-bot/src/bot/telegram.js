import TelegramBot from "node-telegram-bot-api";
import dotenv from "dotenv";
import instagramLooter from "../api/instagramLooter.js";

dotenv.config();

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("BOT_TOKEN is missing in .env file");
  process.exit(1);
}

// Initialize bot - Use polling only if WEBHOOK_URL is not set
const bot = new TelegramBot(token, { polling: !process.env.WEBHOOK_URL });

console.log("🚀 InstaSaver Bot is running...");

// --- Helper Functions ---

/**
 * Sends media back to the user based on type
 */
async function sendInstagramMedia(chatId, mediaItems, caption) {
  try {
    if (!mediaItems || mediaItems.length === 0) {
      return bot.sendMessage(chatId, "❌ No media found for this link.");
    }

    if (mediaItems.length === 1) {
      const item = mediaItems[0];
      // Type can be 'image', 'video' or 'photo'
      if (item.type === "video") {
        await bot.sendVideo(chatId, item.url, { caption });
      } else {
        await bot.sendPhoto(chatId, item.url, { caption });
      }
    } else {
      // Multi-slide (Carousel)
      const mediaGroup = mediaItems.map((item, index) => ({
        type: item.type === "video" ? "video" : "photo",
        media: item.url,
        caption: index === 0 ? caption : "", // Only first item gets the caption
      }));

      // Telegram limits media groups to 10 items
      const chunks = [];
      for (let i = 0; i < mediaGroup.length; i += 10) {
        chunks.push(mediaGroup.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        await bot.sendMediaGroup(chatId, chunk);
      }
    }
  } catch (error) {
    console.error("Send Media Error:", error.message);
    bot.sendMessage(
      chatId,
      "⚠️ Failed to send media. It might be too large or the link expired.",
    );
  }
}

// --- Bot Commands ---

// /start
bot.onText(/\/start/, (msg) => {
  const welcomeMessage = `
👋 *Welcome to InstaSaver Bot!*

I can help you download Instagram content easily.
Just send me an Instagram link (Post, Reel, Story) or use the commands below.

*Commands:*
👤 \`/dp @username\` - Download profile picture
📷 \`/stories @username\` - Download current stories
✨ \`/highlights @username\` - Get user highlights
❓ \`/help\` - Show help message

*Just paste a link:*
🔗 https://www.instagram.com/p/...
🔗 https://www.instagram.com/reels/...
  `;
  bot.sendMessage(msg.chat.id, welcomeMessage, { parse_mode: "Markdown" });
});

// /help
bot.onText(/\/help/, (msg) => {
  const helpText = `
📖 *How to use:*
1. *Post/Reel:* Simply paste the link here.
2. *DP:* Use \`/dp @username\` or \`/dp username\`.
3. *Stories:* Use \`/stories @username\`.
4. *Highlights:* Use \`/highlights @username\`.

*Note:* Bot works only for public accounts.
  `;
  bot.sendMessage(msg.chat.id, helpText, { parse_mode: "Markdown" });
});

// /dp (Profile Picture)
bot.onText(/\/dp (.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const username = match[1].replace("@", "").trim();

  const statusMsg = await bot.sendMessage(
    chatId,
    "⏳ Fetching profile picture...",
  );

  try {
    const data = await instagramLooter.getProfileInfo(username);
    const dpUrl = data.profile_pic_url_hd || data.profile_pic_url;

    if (dpUrl) {
      await bot.sendPhoto(chatId, dpUrl, {
        caption: `✨ *Profile Picture of @${username}*`,
        parse_mode: "Markdown",
      });
      bot.deleteMessage(chatId, statusMsg.message_id);
    } else {
      bot.editMessageText(`❌ Could not find DP for @${username}`, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
      });
    }
  } catch (error) {
    bot.editMessageText(`❌ Error: ${error.message}`, {
      chat_id: chatId,
      message_id: statusMsg.message_id,
    });
  }
});

// /stories
bot.onText(/\/stories (.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const username = match[1].replace("@", "").trim();

  const statusMsg = await bot.sendMessage(
    chatId,
    `⏳ Fetching stories for @${username}...`,
  );

  try {
    const data = await instagramLooter.getStories(username);
    // Standard response for stories is usually a list of media
    const stories = data.stories || data.items || [];

    if (stories.length === 0) {
      return bot.editMessageText(
        `📭 No active stories found for @${username}`,
        {
          chat_id: chatId,
          message_id: statusMsg.message_id,
        },
      );
    }

    bot.deleteMessage(chatId, statusMsg.message_id);

    // Process stories
    const mediaItems = stories.map((s) => ({
      url: s.video_url || s.image_url || s.display_url,
      type: s.is_video ? "video" : "photo",
    }));

    await sendInstagramMedia(
      chatId,
      mediaItems,
      `📱 Stories from @${username}`,
    );
  } catch (error) {
    bot.editMessageText(`❌ Error: ${error.message}`, {
      chat_id: chatId,
      message_id: statusMsg.message_id,
    });
  }
});

// Handle incoming links (Posts/Reels)
bot.on("message", async (msg) => {
  // Ignore commands
  if (msg.text?.startsWith("/")) return;

  const instagramUrlRegex =
    /(https?:\/\/(?:www\.)?instagram\.com\/(?:p|reel|reels)\/([^/?#&]+))/;
  const match = msg.text?.match(instagramUrlRegex);

  if (match) {
    const chatId = msg.chat.id;
    const url = match[1];
    const statusMsg = await bot.sendMessage(chatId, "⏳ Processing link...");

    try {
      const data = await instagramLooter.getMediaInfo(url);

      // Structure depends on API: typically an array of media or single object
      let mediaItems = [];
      const caption = data.caption || "✅ Downloaded using @InstaSaverBot";

      if (data.media) {
        mediaItems = data.media; // Already formatted?
      } else if (data.items) {
        mediaItems = data.items.map((item) => ({
          url: item.video_url || item.image_url || item.display_url,
          type: item.is_video ? "video" : "photo",
        }));
      } else if (data.video_url || data.display_url) {
        mediaItems = [
          {
            url: data.video_url || data.display_url,
            type: data.video_url ? "video" : "photo",
          },
        ];
      }

      await sendInstagramMedia(chatId, mediaItems, caption);
      bot.deleteMessage(chatId, statusMsg.message_id);
    } catch (error) {
      bot.editMessageText(`❌ Error processing link: ${error.message}`, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
      });
    }
  }
});

// Handle Highlights (Basic implementation) - Shows list and asks user?
bot.onText(/\/highlights (.*)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const username = match[1].replace("@", "").trim();

  const statusMsg = await bot.sendMessage(
    chatId,
    `⏳ Fetching highlights for @${username}...`,
  );

  try {
    const data = await instagramLooter.getHighlights(username);
    const highlights = data.highlights || data.items || [];

    if (highlights.length === 0) {
      return bot.editMessageText(`📭 No highlights found for @${username}`, {
        chat_id: chatId,
        message_id: statusMsg.message_id,
      });
    }

    let response = `✨ *Highlights for @${username}*\n\n`;
    highlights.forEach((h, i) => {
      response += `${i + 1}. ${h.title}\n`;
    });
    response += `\n_Note: To download a specific highlight, integration with IDs is required._`;

    bot.editMessageText(response, {
      chat_id: chatId,
      message_id: statusMsg.message_id,
      parse_mode: "Markdown",
    });
  } catch (error) {
    bot.editMessageText(`❌ Error: ${error.message}`, {
      chat_id: chatId,
      message_id: statusMsg.message_id,
    });
  }
});

export default bot;
