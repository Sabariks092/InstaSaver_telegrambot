const fastify = require("fastify")({
  logger: true,
});
require("dotenv").config();

// Initialize the bot (it starts polling in controllers/bot.js)
const bot = require("./controllers/bot");

// Health check route for Render
fastify.get("/", async (request, reply) => {
  return { status: "ok", message: "InstaSaver Bot is running" };
});

fastify.get("/health", async (request, reply) => {
  return { status: "ok" };
});

// Run the server
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port: port, host: "0.0.0.0" });
    console.log(`🚀 Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
