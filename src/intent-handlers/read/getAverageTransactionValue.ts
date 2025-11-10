// File: src/intent-handlers/read/getAverageTransactionValue.ts

import { createFinTrackApiClient } from "../../services/fintrackClient";
import { HandlerResult } from "../../services/intentHandler";
import { ExtractedData } from "../../services/geminiExtractor";
import { generateReply } from "../../services/geminiReplyService";

export const getAverageTransactionValue = async (
  data: ExtractedData
): Promise<HandlerResult> => {
  const { intent, token, timeRange } = data;

  if (!token || !timeRange) {
    return { reply: "Lỗi: Thiếu thông tin xác thực hoặc thời gian." };
  }

  try {
    const apiClient = createFinTrackApiClient(token);

    // 1. ⭐️ GỌI 2 API SONG SONG (Promise.all) ⭐️

    // Tạo các params chung
    const apiParams = {
      startDate: timeRange.startDate,
      endDate: timeRange.endDate,
    };

    // Promise 1: Lấy tổng chi tiêu (từ /dashboard hoặc /stats/summary)
    const summaryPromise = apiClient.get(`/dashboard`, {
      params: apiParams,
    });

    // Promise 2: Lấy TỔNG SỐ LƯỢNG giao dịch (từ /transaction)
    // Chúng ta phải lọc 'expense' và đặt limit=1 để API chạy nhanh
    const countPromise = apiClient.get(`/transaction`, {
      params: {
        ...apiParams,
        type: "expense", // ❗️ Quan trọng: Phải lọc 'expense'
        limit: 1, // Chỉ cần tổng số, không cần data
      },
    });

    // Chờ cả hai hoàn thành
    const [summaryRes, transactionRes] = await Promise.all([
      summaryPromise,
      countPromise,
    ]);

    // 2. Lấy dữ liệu
    const totalExpense = summaryRes.data.totalExpense || 0;
    const currency = summaryRes.data.currency || "VND";
    // Lấy 'total' (tổng số lượng) từ API /transaction
    const expenseCount = transactionRes.data.total || 0; 

    // 3. ⭐️ LOGIC TÍNH TOÁN (CORE) ⭐️
    const average = expenseCount > 0 ? totalExpense / expenseCount : 0;

    // 4. Gói dữ liệu
    const apiData = {
      average: average,
      totalExpense: totalExpense,
      transactionCount: expenseCount,
      currency: currency,
    };

    // 5. Gọi Reply Service (không thay đổi)
    const replyString = await generateReply(intent, apiData, timeRange);

    return {
      reply: replyString,
      data: apiData,
    };
  } catch (error) {
    console.error(`Lỗi khi lấy average transaction cho ${intent}:`, error);
    return {
      reply: "Rất tiếc, tôi không thể tính được giá trị trung bình giao dịch.",
    };
  }
};