// src/services/contextManager.ts
import { redis } from '../utils/redisClient'

const EXPIRATION = 60 * 10; // TTL 10 phút cho mỗi cuộc trò chuyện

// Lưu context của user (ví dụ: intent, thời gian)
export const saveUserContext = async (userId: string, context: any) => {
  await redis.setEx(`context:${userId}`, EXPIRATION, JSON.stringify(context));
};

// Lấy context hiện tại
export const getUserContext = async (userId: string) => {
  const data = await redis.get(`context:${userId}`);
  return data ? JSON.parse(data) : null;
};

// Xóa context khi cần (ví dụ: khi user đổi chủ đề)
export const clearUserContext = async (userId: string) => {
  await redis.del(`context:${userId}`);
};
