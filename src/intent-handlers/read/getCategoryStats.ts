// File: src/intent-handlers/read/getCategoryStats.ts

import { createFinTrackApiClient } from "../../services/fintrackClient";
import { HandlerResult } from "../../services/intentHandler";
import { ExtractedData } from "../../services/geminiExtractor";
import { generateReply } from "../../services/geminiReplyService"; // Import dịch vụ reply

/**
 * Handler này xử lý CÁC intent liên quan đến /stats/category-stats:
 * - top_spending_category
 * - top_income_category
 * - spending_by_category (và có thể cả 'income_by_category')
 */
export const getCategoryStats = async (
  data: ExtractedData
): Promise<HandlerResult> => {
  // 1. Lấy thông tin từ object 'data'
  const { intent, token, timeRange, type, category } = data; // 'type', 'category' được AI trích xuất

  // 2. Kiểm tra lỗi cơ bản
  if (!token) {
    return { reply: "Lỗi: Phiên xác thực của bạn không hợp lệ." };
  }
  if (!timeRange) {
    return { reply: "Lỗi: Tôi không thể xác định khoảng thời gian." };
  }

  // 3. Suy luận 'type' (loại) dựa trên intent nếu AI không cung cấp
  let queryType: string;
  if (type) {
    queryType = type; // Dùng 'type' từ AI nếu có
  } else {
    // Nếu AI không biết, suy luận từ intent
    queryType = intent.includes("income") ? "income" : "expense";
  }

  try {
    const apiClient = createFinTrackApiClient(token);

    // 4. Xây dựng params
    const params: any = {
      type: queryType,
      startDate: timeRange.startDate,
      endDate: timeRange.endDate,
    };
    
    // Nếu intent là 'spending_by_category' VÀ AI trích xuất được 'category'
    // (ví dụ: "chi tiêu cho Ăn uống"), thì lọc theo category đó.
    if (intent === 'spending_by_category' && category) {
      params.category = category;
    }

    // 5. Gọi API
    const res = await apiClient.get(`/stats/category-stats`, { params });

    // 6. Chuẩn bị dữ liệu cho replyService
    const apiData = {
      ...res.data, // Gửi { stats: [...], currency: '...' }
      type: queryType,
      categoryFilter: (intent === 'spending_by_category' && category) ? category : null,
    };

    // 7. Gọi Reply Service để tạo câu trả lời
    const replyString = await generateReply(intent, apiData, timeRange);

    // 8. Trả về HandlerResult chuẩn
    return {
      reply: replyString,
      data: apiData,
    };
  } catch (error) {
    console.error(`Lỗi khi lấy category stats cho ${intent}:`, error);
    return {
      reply: "Rất tiếc, tôi không thể lấy được thống kê danh mục của bạn.",
    };
  }
};