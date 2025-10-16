// src/utils/redisClient.ts
import { createClient } from "redis";

export const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redis.on("error", (err) => console.error("❌ Redis Client Error", err));

(async () => {
  await redis.connect();
  console.log("✅ Redis connected");
})();
