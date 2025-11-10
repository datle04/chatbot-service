"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleChat = void 0;
const chatbotService_1 = require("../services/chatbotService");
const handleChat = async (req, res) => {
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
        const result = await (0, chatbotService_1.chatbotService)(userId, message, token);
        return res.json(result);
    }
    catch (err) {
        console.error("❌ handleChat error:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};
exports.handleChat = handleChat;
