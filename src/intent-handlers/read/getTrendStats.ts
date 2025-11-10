// File: src/intent-handlers/read/getTrendStats.ts

import { createFinTrackApiClient } from "../../services/fintrackClient";
import { HandlerResult } from "../../services/intentHandler";
import { ExtractedData } from "../../services/geminiExtractor";
import { generateReply } from "../../services/geminiReplyService"; // Import dịch vụ reply

/**
 * Handler này xử lý 'spending_trend' và 'income_trend'
 * Bằng cách gọi MỘT API duy nhất
 */
export const getTrendStats = async (
  data: ExtractedData
): Promise<HandlerResult> => {
  const { intent, token, timeRange } = data;

  if (!token) {
    return { reply: "Lỗi: Phiên xác thực của bạn không hợp lệ." };
  }
  if (!timeRange) {
    return { reply: "Lỗi: Tôi không thể xác định khoảng thời gian." };
  }

  // Quyết định 'type' dựa trên 'intent'
  const type = intent === "spending_trend" ? "expense" : "income";

  try {
    const apiClient = createFinTrackApiClient(token);

    // 1. ⭐️ GỌI MỘT API TREND DUY NHẤT ⭐️
    // (Bạn cần tạo API này bên backend)
    const res = await apiClient.get(`/stats/trend-stats`, {
      params: {
        type: type,
        startDate: timeRange.startDate,
        endDate: timeRange.endDate,
      },
    });

    // 2. Giả sử backend trả về: { trend: [...], currency: 'VND' }
    const apiData = res.data;

    // 3. Gọi Reply Service (dùng AI vì đây là intent phức tạp)
    const replyString = await generateReply(intent, apiData, timeRange);

    // 4. Trả về HandlerResult
    return {
      reply: replyString,
      data: apiData,
    };
  } catch (error) {
    console.error(`Lỗi khi lấy trend cho ${intent}:`, error);
    return {
      reply: "Rất tiếc, tôi không thể lấy được dữ liệu xu hướng của bạn.",
    };
  }
};