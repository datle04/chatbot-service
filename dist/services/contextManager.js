"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearUserContext = exports.getUserContext = exports.saveUserContext = void 0;
// src/services/contextManager.ts
const redisClient_1 = require("../utils/redisClient");
const EXPIRATION = 60 * 10; // TTL 10 phút cho mỗi cuộc trò chuyện
// Lưu context của user (ví dụ: intent, thời gian)
const saveUserContext = async (userId, context) => {
    await redisClient_1.redis.setEx(`context:${userId}`, EXPIRATION, JSON.stringify(context));
};
exports.saveUserContext = saveUserContext;
// Lấy context hiện tại
const getUserContext = async (userId) => {
    const data = await redisClient_1.redis.get(`context:${userId}`);
    return data ? JSON.parse(data) : null;
};
exports.getUserContext = getUserContext;
// Xóa context khi cần (ví dụ: khi user đổi chủ đề)
const clearUserContext = async (userId) => {
    await redisClient_1.redis.del(`context:${userId}`);
};
exports.clearUserContext = clearUserContext;
