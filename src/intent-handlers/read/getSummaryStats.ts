// File: src/intent-handlers/read/getSummaryStats.ts

import { ExtractedData } from "../../services/geminiExtractor";
import { HandlerResult } from "../../services/intentHandler";
import { createFinTrackApiClient } from "../../services/fintrackClient";
// ✅✅✅ CHỈ CẦN IMPORT HÀM MỚI
import { generateReply } from "../../services/geminiReplyService";

export const getSummaryStats = async (
  data: ExtractedData
): Promise<HandlerResult> => {
  const { intent, token, timeRange } = data;

  try {
    const apiClient = createFinTrackApiClient(token!);
    
    // 1. Gọi API backend CHUNG
    const res = await apiClient.get("/dashboard", {
      params: {
        startDate: timeRange!.startDate,
        endDate: timeRange!.endDate,
      },
    });

    // 2. Lấy dữ liệu thô từ backend
    const apiData = res.data;

    // 3. Yêu cầu "Reply Service" tạo câu trả lời
    // (Nó sẽ tự biết dùng template nhanh hay dùng AI chậm)
    const replyString = await generateReply(intent, apiData, timeRange);

    // 4. Trả về câu trả lời
    return {
      reply: replyString,
      data: apiData, // Vẫn gửi kèm data thô
    };
    
  } catch (error) {
    console.error(`Lỗi khi lấy stats cho intent ${intent}:`, error);
    return {
      reply: "Rất tiếc, tôi không thể lấy được thống kê của bạn lúc này.",
    };
  }
};