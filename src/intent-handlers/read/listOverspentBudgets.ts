// File: src/intent-handlers/read/listOverspentBudgets.ts

import { createFinTrackApiClient } from "../../services/fintrackClient";
import { HandlerResult } from "../../services/intentHandler";
import { ExtractedData } from "../../services/geminiExtractor";
import { generateReply } from "../../services/geminiReplyService";
import { getCategoryDisplayName } from "../../types/categoryMapper"; // <-- Import hàm mapper
import axios from "axios";

export const listOverspentBudgets = async (
  data: ExtractedData
): Promise<HandlerResult> => {
  const { intent, token, timeRange } = data;

  if (!token || !timeRange) {
    return { reply: "Lỗi: Thiếu thông tin xác thực hoặc thời gian." };
  }

  // 1. Trích xuất month và year (giống hệt checkBudgetStatus)
  const dateObj = new Date(timeRange.startDate);
  const year = dateObj.getFullYear();
  const month = dateObj.getMonth() + 1;

  try {
    const apiClient = createFinTrackApiClient(token);

    // 2. Gọi CÙNG MỘT API /budget
    const res = await apiClient.get(`/budget`, {
      params: { year, month },
    });
    const apiResult = res.data; // (Dữ liệu đầy đủ từ API)

    // 3. ⭐️ LOGIC LỌC (MỚI) ⭐️
    const allStats = apiResult.categoryStats || [];
    const overspentList = allStats.filter(
      (c: any) => c.percentUsed > 100
    );

    // 4. Chuẩn bị dữ liệu cho Reply Service
    // Chúng ta tính toán sẵn các giá trị vượt chi ở đây
    const isMultiCurrency =
      apiResult.originalCurrency && apiResult.originalCurrency !== "VND";

    const formattedList = overspentList.map((item: any) => {
      const categoryName = getCategoryDisplayName(item.category);
      let overAmount, currency;

      if (isMultiCurrency) {
        // Tính toán dựa trên tiền tệ gốc (ví dụ: EUR)
        currency = apiResult.originalCurrency;
        const spentOriginal = (item.originalBudgetedAmount * item.percentUsed) / 100;
        overAmount = spentOriginal - item.originalBudgetedAmount;
      } else {
        // Tính toán dựa trên tiền tệ đã quy đổi (ví dụ: VND)
        currency = "VND"; // Hoặc apiResult.currency
        overAmount = item.spentAmount - item.budgetedAmount;
      }
      return { categoryName, overAmount, currency };
    });

    // 5. Gói dữ liệu đã lọc và tính toán
    const apiData = {
      overspentList: formattedList,
      total: formattedList.length,
    };

    // 6. Gọi Reply Service để tạo câu trả lời
    const replyString = await generateReply(intent, apiData, timeRange);

    return {
      reply: replyString,
      data: apiData,
    };
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return {
        reply: `Bạn chưa thiết lập ngân sách nào cho ${timeRange.startDate} đến ${timeRange.endDate}.`,
      };
    }
    console.error(`Lỗi khi lấy overspent budgets cho ${intent}:`, error);
    return {
      reply: "Rất tiếc, tôi không thể lấy được thông tin ngân sách của bạn.",
    };
  }
};