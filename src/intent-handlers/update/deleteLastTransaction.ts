// src/chatbot/intent-handlers/transaction.handler.ts
import { createFinTrackApiClient } from "../../services/fintrackClient";
import { ExtractedData } from "../../services/geminiExtractor";
import { generateReply } from "../../services/geminiReplyService";
import { HandlerResult } from "../../services/intentHandler";

export const deleteLastTransaction = async (data: ExtractedData): Promise<HandlerResult> => {
    const { intent, token } = data;

    if (!token) {
        return { reply: "Lỗi xác thực: Vui lòng đăng nhập lại để thực hiện thao tác này." };
    }

    try {
        const apiClient = createFinTrackApiClient(token);

        // 1. Gọi API Backend để xóa (DELETE /api/transactions/last)
        const response = await apiClient.delete('/transaction/last-transaction');
        
        // Backend trả về: { success: true, data: { ...transaction info... } }
        const deletedTx = response.data.data;

        // 2. Chuyển tiếp data sang Reply Service để format
        const replyString = await generateReply(intent, deletedTx, null);

        return {
            reply: replyString,
            data: deletedTx
        };

    } catch (error: any) {
        console.error(`Lỗi delete_last_transaction:`, error);
        
        // Xử lý lỗi đặc thù
        if (error.response && error.response.status === 404) {
            return { reply: "Hệ thống kiểm tra thấy bạn chưa có giao dịch nào để xóa cả." };
        }

        return { reply: "Xin lỗi, đã có lỗi xảy ra khi cố gắng xóa giao dịch. Bạn thử lại sau nhé." };
    }
};