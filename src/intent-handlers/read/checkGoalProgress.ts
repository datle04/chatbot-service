// File: src/intent-handlers/read/checkGoalProgress.ts

import { createFinTrackApiClient } from "../../services/fintrackClient";
import { HandlerResult } from "../../services/intentHandler";
import { ExtractedData } from "../../services/geminiExtractor";
import { generateReply } from "../../services/geminiReplyService";

// Helper để chuẩn hóa tên (rất quan trọng để so khớp)
const normalize = (text: string) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");
};

export const checkGoalProgress = async (
  data: ExtractedData
): Promise<HandlerResult> => {
  const { intent, token, goal_name } = data; // Lấy goal_name từ AI

  if (!token) {
    return { reply: "Lỗi: Phiên xác thực của bạn không hợp lệ." };
  }

  // 1. Kiểm tra xem AI có bắt được tên mục tiêu không
  if (!goal_name) {
    return { reply: "Bạn muốn tôi kiểm tra tiến độ cho mục tiêu nào vậy?" };
  }

  try {
    const apiClient = createFinTrackApiClient(token);

    // 2. Gọi API /goals (cùng API với listSavingGoals)
    const res = await apiClient.get(`/goals`);
    const allGoals: any[] = res.data || []; // apiData là mảng []

    // 3. ⭐️ LOGIC LỌC (CORE) ⭐️
    // Tìm mục tiêu trong mảng dựa trên tên
    const normalizedQuery = normalize(goal_name);
    const foundGoal = allGoals.find((goal: any) =>
      normalize(goal.name).includes(normalizedQuery)
    );

    // 4. Gói dữ liệu (có thể là 'null' nếu không tìm thấy)
    const apiData = {
      goal: foundGoal || null,
      query: goal_name, // Gửi kèm tên user hỏi để reply
    };

    // 5. Gọi Reply Service (timeRange là null)
    const replyString = await generateReply(intent, apiData, null);

    return {
      reply: replyString,
      data: apiData,
    };
  } catch (error) {
    console.error(`Lỗi khi lấy goal progress cho ${intent}:`, error);
    return {
      reply: "Rất tiếc, tôi không thể lấy được danh sách mục tiêu của bạn.",
    };
  }
};