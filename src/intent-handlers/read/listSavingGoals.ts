// File: src/intent-handlers/read/listSavingGoals.ts

import { createFinTrackApiClient } from "../../services/fintrackClient";
import { HandlerResult } from "../../services/intentHandler";
import { ExtractedData } from "../../services/geminiExtractor";
import { generateReply } from "../../services/geminiReplyService";
import axios from "axios";

export const listSavingGoals = async (
  data: ExtractedData
): Promise<HandlerResult> => {
  const { intent, token } = data; // Intent này không cần timeRange

  if (!token) {
    return { reply: "Lỗi: Phiên xác thực của bạn không hợp lệ." };
  }

  try {
    const apiClient = createFinTrackApiClient(token);

    // 1. Gọi API /goals (Giả sử API trả về mảng)
    const res = await apiClient.get(`/goals`);

    // 2. Dữ liệu API chính là mảng goals
    const apiData = res.data; // apiData bây giờ là mảng []

    // 3. Gọi Reply Service (timeRange là null)
    const replyString = await generateReply(intent, apiData, null);

    return {
      reply: replyString,
      data: apiData,
    };
  } catch (error) {
    console.error(`Lỗi khi lấy saving goals cho ${intent}:`, error);
    return {
      reply: "Rất tiếc, tôi không thể lấy được danh sách mục tiêu của bạn.",
    };
  }
};