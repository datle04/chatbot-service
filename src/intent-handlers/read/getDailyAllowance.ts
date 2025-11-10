// File: src/intent-handlers/read/getDailyAllowance.ts

import { createFinTrackApiClient } from "../../services/fintrackClient";
import { HandlerResult } from "../../services/intentHandler";
import { ExtractedData } from "../../services/geminiExtractor";
import { generateReply } from "../../services/geminiReplyService";
import { calculateTotalDays } from "../../utils/dateUtils";

export const getDailyAllowance = async (
  data: ExtractedData
): Promise<HandlerResult> => {
  const { intent, token, timeRange } = data; // TimeRange (ví dụ: "tháng này")

  if (!token || !timeRange) {
    return { reply: "Lỗi: Thiếu thông tin xác thực hoặc thời gian." };
  }

  try {
    const apiClient = createFinTrackApiClient(token!);
    
    // 1. GỌI API SUMMARY ĐÃ CÓ SẴN
    const res = await apiClient.get(`/dashboard`, {
      params: {
        startDate: timeRange.startDate,
        endDate: timeRange.endDate,
      },
    });

    // 2. ⭐️ THAY ĐỔI CHÍNH ⭐️
    // Lấy totalIncome thay vì totalExpense
    const totalIncome = res.data.totalIncome || 0;
    const currency = res.data.currency || "VND";

    // 3. Tính toán
    const totalDays = calculateTotalDays(timeRange.startDate, timeRange.endDate);
    const allowance = totalDays > 0 ? totalIncome / totalDays : 0;

    // 4. Gói dữ liệu
    const apiData = {
      allowance: allowance,
      totalIncome: totalIncome,
      totalDays: totalDays,
      currency: currency,
    };

    // 5. Gọi Reply Service
    const replyString = await generateReply(intent, apiData, timeRange);

    return {
      reply: replyString,
      data: apiData,
    };
  } catch (error) {
    console.error(`Lỗi khi lấy daily allowance cho ${intent}:`, error);
    return {
      reply: "Rất tiếc, tôi không thể tính được hạn mức chi tiêu của bạn.",
    };
  }
};