# InstaSaver Telegram Bot 🤖

A production-ready Telegram bot to download Instagram posts, reels, and profile pictures. Built with Node.js, Telegraf, and `instagram-scraper-api`.

## 🚀 Features
- **Download Media**: Save photos and videos from any public Instagram link.
- **Profile Picture**: Download high-quality DPs using `@username`.
- **Recent Posts**: Fetch the latest 3 posts from any public profile.
- **Smart Parsing**: Automatically detects links and usernames in text.
- **Rate Limiting**: Integrated protection (5 req/min per user).
- **Deployment Ready**: Includes Docker and PM2 configurations.

## 🛠️ Tech Stack
- **Engine**: Node.js 20+
- **Framework**: Telegraf v4
- **API**: instagram-scraper-api
- **Server**: Express (Webhook support)

## 📦 Installation

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file:
   ```env
   BOT_TOKEN=your_telegram_bot_token
   PORT=3000
   WEBHOOK_URL=https://your-domain.com # Optional, leaves as blank for long polling
   ```

3. Start the bot:
   ```bash
   npm start
   ```

## 🐳 Docker Deployment
```bash
docker build -t instasaver-bot .
docker run -p 3000:3000 --env-file .env instasaver-bot
```

## ⚙️ PM2 Deployment
```bash
pm2 start ecosystem.config.cjs
```

## 📖 Bot Commands
- `/start` - Welcome message
- `/dp @username` - Download profile picture
- `/post [link]` - Download media from post/reel
- `/user @username` - Get latest 3 posts
- `/help` - Show command list

## 🧪 Testing
```bash
npm test
```

## 📝 License
MIT
