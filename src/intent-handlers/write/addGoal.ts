// File: src/intent-handlers/write/addGoal.ts

import { createFinTrackApiClient } from "../../services/fintrackClient";
import { HandlerResult } from "../../services/intentHandler";
import { ExtractedData } from "../../services/geminiExtractor";
import { generateReply } from "../../services/geminiReplyService";

export const addGoal = async (
  data: ExtractedData
): Promise<HandlerResult> => {
  // Lấy dữ liệu từ AI
  const { token, amount, goal_name, currency, transactionDate } = data;

  if (!token) return { reply: "Lỗi xác thực." };

  // 1. VALIDATION
  if (!amount) {
    return { reply: "Mục tiêu này cần bao nhiêu tiền?" };
  }
  
  // Tên mục tiêu: Nếu AI không bắt được, dùng mặc định
  const finalName = goal_name || "Mục tiêu tiết kiệm mới";
  
  // 2. XỬ LÝ NGÀY MỤC TIÊU (Deadline)
  // AI trả về 'transactionDate' (do quy tắc logic của chúng ta cho intent GHI)
  // Nếu null, mặc định là 1 năm sau
  let targetDate = transactionDate;
  if (!targetDate) {
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    targetDate = nextYear.toISOString();
  }

  try {
    const apiClient = createFinTrackApiClient(token);

    // 3. GỌI API
    const res = await apiClient.post("/goals", {
      name: finalName,
      targetOriginalAmount: amount,          // AI đã xử lý số liệu (50k -> 50000)
      targetCurrency: currency || "VND", // AI đã xử lý tiền tệ (đô -> USD)
      targetDate: targetDate,
      description: "Tạo bởi FinAI",
    });

    console.log("Goal created:", res.data);

    const createdGoal = res.data;

    // 4. GỌI REPLY SERVICE
    const replyString = await generateReply("add_goal", createdGoal, null);
    
    return {
      reply: replyString,
      data: createdGoal
    };
  } catch (error) {
    console.error("Lỗi add goal:", error);
    return { reply: "Không thể tạo mục tiêu lúc này." };
  }
};