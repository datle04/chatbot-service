// File: src/intent-handlers/read/getSpendingForecast.ts

import { createFinTrackApiClient } from "../../services/fintrackClient";
import { HandlerResult } from "../../services/intentHandler";
import { ExtractedData } from "../../services/geminiExtractor";
import { generateReply } from "../../services/geminiReplyService";

export const getSpendingForecast = async (
  data: ExtractedData
): Promise<HandlerResult> => {
  const { intent, token } = data; // Không cần timeRange

  if (!token) {
    return { reply: "Lỗi: Phiên xác thực của bạn không hợp lệ." };
  }

  try {
    const apiClient = createFinTrackApiClient(token);

    // 1. ⭐️ GỌI API MỚI (Không cần params) ⭐️
    const res = await apiClient.get(`/stats/forecast`);

    // 2. Lấy dữ liệu đã tính toán
    const apiData = res.data;

    // 3. Gọi Reply Service (dùng AI vì đây là intent phức tạp)
    const replyString = await generateReply(intent, apiData, null); // Không cần timeRange

    return {
      reply: replyString,
      data: apiData,
    };
  } catch (error) {
    console.error(`Lỗi khi lấy forecast cho ${intent}:`, error);
    return {
      reply: "Rất tiếc, tôi không thể tạo dự đoán cho bạn lúc này.",
    };
  }
};