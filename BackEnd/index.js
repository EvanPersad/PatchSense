const express = require("express");
const { Pool } = require("pg");
const { createClient } = require("redis");

const app = express();

const PORT = process.env.PORT || 8080;
const DATABASE_URL = process.env.DATABASE_URL;
const REDIS_URL = process.env.REDIS_URL;

// Postgres connection pool
const pgPool = new Pool({ connectionString: DATABASE_URL });

// Redis client
const redisClient = createClient({ url: REDIS_URL });
redisClient.on("error", (err) => console.error("Redis error:", err));

async function ensureRedis() {
  if (!redisClient.isOpen) await redisClient.connect();
}

// basic route
app.get("/", (req, res) => {
  res.json({ ok: true, message: "Backend container is running" });
});

// verification route: proves backend can reach Postgres + Redis
app.get("/health", async (req, res) => {
  try {
    const pgResult = await pgPool.query("SELECT 1 AS db_ok;");
    await ensureRedis();
    const redisResult = await redisClient.ping();

    res.json({
      ok: true,
      postgres: pgResult.rows[0],
      redis: redisResult,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// bind 0.0.0.0 so Docker port mapping works
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend listening on 0.0.0.0:${PORT}`);
});
