import { Request, Response } from "express";
import { chatbotService } from "../services/chatbotService";
import { AuthRequest } from "../types";

export const handleChat = async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Missing message" });
    }

    // 🧩 Thông tin người dùng đã được verifyUser middleware gắn vào
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const token = req.userToken;
    if (!token) {
      return res.status(401).json({ error: "Invalid token" });
    }
    // ⚡ Không cần lấy lại token — middleware đã xác thực rồi
    const result = await chatbotService(userId, message, token);

    return res.json(result);
  } catch (err) {
    console.error("❌ handleChat error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
