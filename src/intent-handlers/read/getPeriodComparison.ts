// File: src/intent-handlers/read/getPeriodComparison.ts

import { createFinTrackApiClient } from "../../services/fintrackClient";
import { HandlerResult } from "../../services/intentHandler";
import { ExtractedData } from "../../services/geminiExtractor";
import { generateReply } from "../../services/geminiReplyService";

export const getPeriodComparison = async (
  data: ExtractedData
): Promise<HandlerResult> => {
  const { intent, token, timeRange, compareTimeRange, comparisonType } = data;

  // 1. Kiểm tra lỗi (cần cả 2 khoảng thời gian)
  if (!token || !timeRange || !compareTimeRange) {
    return {
      reply: "Tôi hiểu bạn muốn so sánh, nhưng bạn chưa nói rõ hai khoảng thời gian (ví dụ: 'tháng này so với tháng trước').",
    };
  }
  
  // Mặc định so sánh 'expense' nếu AI không trích xuất được
  const type = comparisonType || "expense";

  try {
    const apiClient = createFinTrackApiClient(token);

    // 2. ⭐️ GỌI 2 API SONG SONG ⭐️
    // Promise 1: Lấy dữ liệu kỳ hiện tại
    const currentPeriodPromise = apiClient.get(`/dashboard`, {
      params: { ...timeRange },
    });

    // Promise 2: Lấy dữ liệu kỳ so sánh
    const previousPeriodPromise = apiClient.get(`/dashboard`, {
      params: { ...compareTimeRange },
    });

    // Chờ cả hai hoàn thành
    const [currentRes, previousRes] = await Promise.all([
      currentPeriodPromise,
      previousPeriodPromise,
    ]);
    
    // 3. ⭐️ THỰC HIỆN TÍNH TOÁN (CORE) ⭐️
    const currentData = currentRes.data;
    const previousData = previousRes.data;

    const currentValue = (type === 'expense' ? currentData.totalExpense : currentData.totalIncome) || 0;
    const previousValue = (type === 'expense' ? previousData.totalExpense : previousData.totalIncome) || 0;
    
    const difference = currentValue - previousValue;
    // Tránh lỗi chia cho 0
    const percentChange = (previousValue === 0) ? 100 : (difference / previousValue) * 100;

    // 4. Gói dữ liệu đã tính toán cho Reply Service
    const apiData = {
      type: type,
      currency: currentData.currency || "VND",
      current: {
        value: currentValue,
        ...timeRange
      },
      previous: {
        value: previousValue,
        ...compareTimeRange
      },
      comparison: {
        difference: difference,
        percentChange: percentChange,
      }
    };
    
    // 5. Gọi Reply Service (dùng AI vì đây là intent phức tạp)
    const replyString = await generateReply(intent, apiData, null); // timeRange không cần thiết

    return {
      reply: replyString,
      data: apiData,
    };
  } catch (error) {
    console.error(`Lỗi khi so sánh kỳ:`, error);
    return {
      reply: "Rất tiếc, tôi không thể thực hiện so sánh của bạn lúc này.",
    };
  }
};