// File: src/intent-handlers/read/getTopCategory.ts

import { createFinTrackApiClient } from "../../services/fintrackClient";
import { HandlerResult } from "../../services/intentHandler";
import { ExtractedData } from "../../services/geminiExtractor";
import { generateReply } from "../../services/geminiReplyService"; // <-- Import dịch vụ reply

/**
 * Handler này xử lý cả 'top_spending_category' và 'top_income_category'
 */
export const getTopCategory = async (
  data: ExtractedData
): Promise<HandlerResult> => {
  // 1. Lấy thông tin từ object 'data'
  const { intent, token, timeRange } = data;

  // 2. Kiểm tra lỗi cơ bản
  if (!token) {
    return { reply: "Lỗi: Phiên xác thực của bạn không hợp lệ." };
  }
  if (!timeRange) {
    return { reply: "Lỗi: Tôi không thể xác định khoảng thời gian." };
  }

  // 3. Quyết định 'type' dựa trên 'intent'
  const type = intent === "top_spending_category" ? "expense" : "income";

  try {
    const apiClient = createFinTrackApiClient(token);

    // 4. Gọi API với các tham số đã chuẩn hóa
    const res = await apiClient.get(`/stats/category-stats`, {
      params: {
        type: type, // 'expense' hoặc 'income'
        startDate: timeRange.startDate,
        endDate: timeRange.endDate,
      },
    });

    // 5. Xử lý dữ liệu thô từ API
    const stats = res.data.stats || [];
    const topCategory =
      stats.length > 0
        ? [...stats].sort((a, b) => b.displayAmount - a.displayAmount)[0]
        : null;

    // 6. Chuẩn bị dữ liệu để gửi cho replyService
    const apiData = {
      top: topCategory, // Gửi danh mục top
      all: stats, // Gửi tất cả
      currency: res.data.currency,
      type: type, // Gửi cả type để replyService biết
    };

    // 7. Gọi Reply Service để tạo câu trả lời
    const replyString = await generateReply(intent, apiData, timeRange);

    // 8. Trả về HandlerResult chuẩn
    return {
      reply: replyString,
      data: apiData,
    };
  } catch (error) {
    console.error(`Lỗi khi lấy top category cho ${intent}:`, error);
    return {
      reply: "Rất tiếc, tôi không thể lấy được thống kê danh mục của bạn.",
    };
  }
};