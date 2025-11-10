import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
console.log("🔗 Connecting to Redis at:", redisUrl);

export const redis = createClient({ url: redisUrl });

redis.on("error", (err: Error) => console.error("❌ Redis Client Error", err));

(async () => {
  await redis.connect();
  console.log("✅ Redis connected");
})();
