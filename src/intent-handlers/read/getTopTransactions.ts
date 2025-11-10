// File: src/intent-handlers/read/getTopTransaction.ts

import { createFinTrackApiClient } from "../../services/fintrackClient";
import { HandlerResult } from "../../services/intentHandler";
import { ExtractedData } from "../../services/geminiExtractor";
import { generateReply } from "../../services/geminiReplyService"; // <-- Import dịch vụ reply

/**
 * Handler này xử lý 4 intent:
 * - highest_expense, lowest_expense
 * - highest_income, lowest_income
 */
export const getTopTransaction = async (
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

  // 3. ⭐️ LOGIC SUY LUẬN (CORE) ⭐️
  // Quyết định 'type' và 'order' dựa trên 'intent'
  let type: string;
  let order: string; // 'asc' (tăng dần) hoặc 'desc' (giảm dần)

  switch (intent) {
    case "highest_expense":
      type = "expense";
      order = "desc";
      break;
    case "lowest_expense":
      type = "expense";
      order = "asc";
      break;
    case "highest_income":
      type = "income";
      order = "desc";
      break;
    case "lowest_income":
      type = "income";
      order = "asc";
      break;
    default:
      // Không bao giờ nên xảy ra nếu intentHandler được map đúng
      return { reply: "Lỗi: Intent không được hỗ trợ bởi handler này." };
  }

  try {
    const apiClient = createFinTrackApiClient(token);

    // 4. Gọi API với các tham số đã suy luận
    const res = await apiClient.get(`/transaction/top-transactions`, {
      params: {
        startDate: timeRange.startDate,
        endDate: timeRange.endDate,
        type,
        order,
      },
    });

    console.log(res.data);

    // 5. Lấy dữ liệu thô từ API (Giả sử API trả về 1 object)
    // res.data có thể là { transaction: {...} } hoặc chỉ { ... }
    const apiData = res.data; 

    // 6. Gọi Reply Service để tạo câu trả lời
    const replyString = await generateReply(intent, apiData, timeRange);

    // 7. Trả về HandlerResult chuẩn
    return {
      reply: replyString,
      top: apiData.data[0],
      data: apiData,
    };
  } catch (error) {
    console.error(`Lỗi khi lấy top transaction cho ${intent}:`, error);
    return {
      reply: "Rất tiếc, tôi không thể lấy được thông tin giao dịch của bạn.",
    };
  }
};