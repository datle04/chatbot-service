// File: src/intent-handlers/read/getAverageSpending.ts

import { createFinTrackApiClient } from "../../services/fintrackClient";
import { HandlerResult } from "../../services/intentHandler";
import { ExtractedData } from "../../services/geminiExtractor";
import { generateReply } from "../../services/geminiReplyService";
import { calculateTotalDays } from "../../utils/dateUtils"; // <-- Import hàm tiện ích

export const getAverageSpending = async (
  data: ExtractedData
): Promise<HandlerResult> => {
  const { intent, token, timeRange } = data;

  if (!token || !timeRange) {
    return { reply: "Lỗi: Thiếu thông tin xác thực hoặc thời gian." };
  }

  try {
    const apiClient = createFinTrackApiClient(token);

    // 1. GỌI API SUMMARY ĐÃ CÓ SẴN (Tái sử dụng)
    const res = await apiClient.get(`/dashboard`, {
      // (Hoặc /dashboard, miễn là nó trả về totalExpense)
      params: {
        startDate: timeRange.startDate,
        endDate: timeRange.endDate,
      },
    });

    // 2. Lấy dữ liệu
    const totalExpense = res.data.totalExpense || 0;
    const currency = res.data.currency || "VND";

    // 3. ⭐️ LOGIC TÍNH TOÁN (CORE) ⭐️
    const totalDays = calculateTotalDays(timeRange.startDate, timeRange.endDate);
    
    // Tránh lỗi chia cho 0
    const average = totalDays > 0 ? totalExpense / totalDays : 0;

    // 4. Gói dữ liệu đã tính toán
    const apiData = {
      average: average,
      totalExpense: totalExpense,
      totalDays: totalDays,
      currency: currency,
    };

    // 5. Gọi Reply Service để tạo câu trả lời
    const replyString = await generateReply(intent, apiData, timeRange);

    return {
      reply: replyString,
      data: apiData,
    };
  } catch (error) {
    console.error(`Lỗi khi lấy average spending cho ${intent}:`, error);
    return {
      reply: "Rất tiếc, tôi không thể tính được chi tiêu trung bình của bạn.",
    };
  }
};