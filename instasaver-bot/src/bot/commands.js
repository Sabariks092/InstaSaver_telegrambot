import { Markup } from "telegraf";
import { getUserDP, getPostMedia, getUserPosts } from "./instagram.js";
import { parseUsername, parseShortcode, formatCaption } from "./utils.js";

export const startHandler = (ctx) => {
  const welcomeMessage = `
🌟 *Welcome to InstaSaver Bot!* 🌟

Download Instagram content easily:
- Send me an Instagram link (Post/Reel)
- Use /dp @username to get profile picture
- Use /user @username to get recent posts
- Or just type the username!

*Commands:*
/start - Welcome message
/dp @username - Download profile pic
/post [link] - Download post/reel
/user @username - Get latest 3 posts
/help - Show this message
  `;
  ctx.replyWithMarkdown(
    welcomeMessage,
    Markup.inlineKeyboard([
      [Markup.button.url("Follow Developer", "https://github.com/bartholomej")],
    ]),
  );
};

export const dpHandler = async (ctx, input) => {
  const username = parseUsername(input || ctx.message.text);
  if (!username)
    return ctx.reply(
      "Please provide a valid username. Example: /dp @cristiano",
    );

  const loading = await ctx.reply("🔍 Fetching Profile Picture...");
  try {
    const avatarUrl = await getUserDP(username);
    await ctx.replyWithPhoto(avatarUrl, {
      caption: `👤 Profile Picture of @${username}`,
      ...Markup.inlineKeyboard([
        [Markup.button.callback("Download More", "help")],
      ]),
    });
  } catch (error) {
    ctx.reply(`❌ Error: ${error.message}`);
  } finally {
    ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id).catch(() => {});
  }
};

export const postHandler = async (ctx, input) => {
  const url = input || ctx.message.text;
  const shortcode = parseShortcode(url);
  if (!shortcode)
    return ctx.reply("Please provide a valid Instagram Post or Reel link.");

  const loading = await ctx.reply("🎬 Fetching Media...");
  try {
    const data = await getPostMedia(shortcode);
    const mediaGroup = data.media.map((m, index) => ({
      type: m.type,
      media: m.url,
      caption:
        index === 0
          ? formatCaption({
              description: data.caption,
              username: data.username,
              time: Date.now() / 1000,
              likesCount: data.likes,
              shortcode: shortcode,
            })
          : "",
    }));

    if (mediaGroup.length === 1) {
      const m = data.media[0];
      if (m.type === "video") {
        await ctx.replyWithVideo(m.url, { caption: mediaGroup[0].caption });
      } else {
        await ctx.replyWithPhoto(m.url, { caption: mediaGroup[0].caption });
      }
    } else {
      await ctx.replyWithMediaGroup(mediaGroup);
    }
  } catch (error) {
    ctx.reply(`❌ Error: ${error.message}`);
  } finally {
    ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id).catch(() => {});
  }
};

export const userHandler = async (ctx, input) => {
  const username = parseUsername(input || ctx.message.text);
  if (!username)
    return ctx.reply(
      "Please provide a valid username. Example: /user @cristiano",
    );

  const loading = await ctx.reply(
    `📸 Fetching latest 3 posts from @${username}...`,
  );
  try {
    const posts = await getUserPosts(username, 3);
    for (const post of posts) {
      const caption = formatCaption(post);
      if (post.isVideo) {
        await ctx.replyWithVideo(post.photo, { caption });
      } else {
        await ctx.replyWithPhoto(post.photo, { caption });
      }
    }
  } catch (error) {
    ctx.reply(`❌ Error: ${error.message}`);
  } finally {
    ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id).catch(() => {});
  }
};

export const helpHandler = (ctx) => {
  const helpText = `
📖 *Available Commands:*
/start - Start the bot
/dp @username - Get high-quality profile picture
/post [link] - Get media from post or reel
/user @username - Get latest 3 posts
/help - Show this guide
  `;
  ctx.replyWithMarkdown(helpText);
};
