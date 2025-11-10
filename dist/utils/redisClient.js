"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redis = void 0;
// src/utils/redisClient.ts
const redis_1 = require("redis");
exports.redis = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || "redis://localhost:6379",
});
exports.redis.on("error", (err) => console.error("❌ Redis Client Error", err));
(async () => {
    await exports.redis.connect();
    console.log("✅ Redis connected");
})();
