const fastify = require("fastify")({
  logger: true,
});
require("dotenv").config();

// 1. REGISTER CORS (Once is enough)
fastify.register(require('@fastify/cors'), { 
  origin: '*', 
  methods: ['GET', 'POST']
});

// 2. CONTROLLERS
const bot = require("./controllers/bot");

// 3. ROUTES (Delete the duplicates, keep one of each)
fastify.get("/", async (request, reply) => {
  return { status: "ok", message: "InstaSaver Bot is running" };
});

fastify.get("/health", async (request, reply) => {
  return { status: "ok" };
});

// 4. RUN SERVER
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
