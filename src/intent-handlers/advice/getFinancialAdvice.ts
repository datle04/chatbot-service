import { createFinTrackApiClient } from "../../services/fintrackClient";
import { ExtractedData } from "../../services/geminiExtractor";
import { generateReply } from "../../services/geminiReplyService";
import { HandlerResult } from "../../services/intentHandler";

export const getFinancialAdvice = async (data: ExtractedData): Promise<HandlerResult> => {
    const { intent, token } = data;

    if (!token) return { reply: "Bạn cần đăng nhập để tôi phân tích dữ liệu nhé." };

    try {
        const apiClient = createFinTrackApiClient(token);

        // 1. Gọi API lấy số liệu thô
        const response = await apiClient.get('/analytics/health');
        const healthData = response.data.data;

        // 2. Chuyển sang Reply Service
        // Ở đây ta truyền healthData vào để Gemini sinh lời khuyên
        const replyString = await generateReply(intent, healthData, null);

        return {
            reply: replyString,
            data: healthData // Frontend có thể dùng data này vẽ biểu đồ nhỏ nếu muốn
        };

    } catch (error) {
        console.error("Advice Error:", error);
        return { reply: "Tôi chưa thể lấy dữ liệu tài chính của bạn lúc này. Hãy thử lại sau nhé." };
    }
};