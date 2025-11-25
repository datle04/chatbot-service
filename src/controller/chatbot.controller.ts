import { Request, Response } from "express";
import { chatbotService } from "../services/chatbotService";
import { AuthRequest } from "../types";

export const handleChat = async (req: Request, res: Response) => {
  try {
    // 1. Lấy tất cả thông tin từ Body (Do Backend Proxy gửi sang)
    // Backend gửi: { message, userId, token, history }
    const { message, userId, token } = req.body;

    // 2. Kiểm tra dữ liệu đầu vào
    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    // Kiểm tra userId (Được Backend gửi sang, không phải lấy từ req.user nữa)
    if (!userId) {
      console.error("❌ Request thiếu userId từ Proxy");
      return res.status(400).json({ error: "Missing userId (Proxy Error)" });
    }

    // 3. Gọi Service xử lý Chat
    // Truyền thẳng userId và token lấy từ body vào service
    const result = await chatbotService(userId, message, token);

    return res.json(result);

  } catch (err) {
    console.error("❌ handleChat error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
