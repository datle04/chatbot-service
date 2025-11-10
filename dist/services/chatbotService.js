"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatbotService = void 0;
const axios_1 = __importDefault(require("axios"));
const contextManager_1 = require("./contextManager");
const geminiService_1 = require("./geminiService");
const intentHandler_1 = require("./intentHandler");
const timeParser_1 = require("./timeParser");
const extractTypeCategory_1 = require("./extractTypeCategory");
const chatbotService = async (userId, question, token) => {
    try {
        const prevContext = await (0, contextManager_1.getUserContext)(userId);
        // 1️⃣ Phân tích intent bằng Gemini
        const intentPrompt = `
    Bạn là hệ thống phân tích câu hỏi người dùng về tài chính cá nhân.
    Nhiệm vụ của bạn là trích xuất 'intent', 'timeRange', 'category' và 'type' từ câu hỏi.
    Thời gian hiện tại là: ${new Date().toISOString()}
    Danh sách intent hợp lệ:
    - total_expense
    - total_income
    - list_transactions
    - list_recurring
    - top_spending_category
    - top_income_category
    - compare_income_vs_expense
    - highest_expense
    - highest_income
    - lowest_expense
    - lowest_income
    - spending_by_category
    - saving_summary
    - average_spending_base_on_income
    - average_spending_base_on_expense
    - spending_trend
    - income_trend
    - unknown

    ${prevContext ? `Ngữ cảnh trước đó: intent="${prevContext.intent}", thời gian="${JSON.stringify(prevContext.timeRange)}"` : ""}
    Nếu người dùng đang hỏi follow-up (ví dụ: "vậy còn tháng trước thì sao?"), hãy suy luận intent và thời gian dựa trên ngữ cảnh trước đó.
    Trả về JSON đúng cấu trúc:
    {
      "intent": "income_trend"
    }

    Câu hỏi: "${question}"
    `;
        const intentRaw = await (0, geminiService_1.askGemini)(intentPrompt);
        const intentData = JSON.parse(intentRaw.replace(/```json|```/g, "").trim());
        // 2️⃣ Phân tích khoảng thời gian
        const timeRange = await (0, timeParser_1.extractTimeRange)(question);
        const { type, category } = (0, extractTypeCategory_1.extractTypeAndCategory)(question);
        const startDate = timeRange?.startDate ??
            new Date(new Date().getFullYear(), new Date().getMonth(), 1)
                .toISOString()
                .split("T")[0];
        const endDate = timeRange?.endDate ?? new Date().toISOString().split("T")[0];
        // 3️⃣ Gọi xử lý intent
        const result = await (0, intentHandler_1.handleIntent)({
            intent: intentData.intent,
            userId,
            userToken: token,
            timeRange: { startDate, endDate },
            type,
            category
        });
        try {
            await Promise.all([
                axios_1.default.post(`${process.env.FINTRACK_API_URL}/chat-history`, {
                    userId,
                    role: "user",
                    text: question,
                }, { headers: { Authorization: `Bearer ${token}` } }),
                axios_1.default.post(`${process.env.FINTRACK_API_URL}/chat-history`, {
                    userId,
                    role: "bot",
                    text: result.reply,
                }, { headers: { Authorization: `Bearer ${token}` } })
            ]);
        }
        catch (error) {
            console.error("⚠️ Lỗi khi lưu chat history:", error);
        }
        // Lưu context
        await (0, contextManager_1.saveUserContext)(userId, {
            intent: intentData.intent,
            timeRange: { startDate, endDate },
        });
        // 4️⃣ Trả kết quả
        return {
            intent: intentData.intent,
            timeRange: { startDate, endDate },
            result,
        };
    }
    catch (error) {
        console.error("❌ chatbotService error:", error);
        return {
            intent: "unknown",
            timeRange: null,
            error: error instanceof Error ? error.message : error,
        };
    }
};
exports.chatbotService = chatbotService;
