// src/chatbot/intent-handlers/recurring.handler.ts
import { createFinTrackApiClient } from "../../services/fintrackClient";
import { ExtractedData } from "../../services/geminiExtractor";
import { generateReply } from "../../services/geminiReplyService";
import { HandlerResult } from "../../services/intentHandler";

export const cancelRecurringTransaction = async (data: ExtractedData): Promise<HandlerResult> => {
    const { intent, token, recurring_keyword } = data;

    if (!token) return { reply: "Lỗi xác thực." };
    if (!recurring_keyword) return { reply: "Bạn muốn hủy gói nào? (Ví dụ: 'Hủy Netflix')" };

    try {
        const apiClient = createFinTrackApiClient(token);

        // 🔥 GỌI ROUTE MỚI: Truyền thẳng keyword
        const response = await apiClient.delete('/transaction/recurring/by-keyword', {
            params: { keyword: recurring_keyword }
        });
        
        const deletedTemplate = response.data.data;
        const replyString = await generateReply(intent, deletedTemplate, null);

        return { reply: replyString, data: deletedTemplate };

    } catch (error: any) {
        // Xử lý 404 từ Controller trả về
        if (error.response && error.response.status === 404) {
             return { reply: `Tôi tìm trong danh sách định kỳ nhưng không thấy gói nào tên là "${recurring_keyword}". Bạn vui lòng kiểm tra lại nhé.` };
        }
        console.error(`Lỗi cancel_recurring:`, error);
        return { reply: "Có lỗi xảy ra khi hủy gói định kỳ." };
    }
};