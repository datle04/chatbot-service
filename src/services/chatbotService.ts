import axios from "axios";
import { getUserContext, saveUserContext } from "./contextManager";
import { askGemini } from "./geminiService";
import { handleIntent } from "./intentHandler";
import { extractTimeRange } from "./timeParser";
import { extractTypeAndCategory } from "./extractTypeCategory";

export const chatbotService = async (userId: string, question: string, token: string) => {
  try {
    const prevContext = await getUserContext(userId);

    // 1️⃣ Phân tích intent bằng Gemini
    const intentPrompt = `
    Bạn là hệ thống phân tích câu hỏi người dùng về tài chính cá nhân.
    Danh sách intent hợp lệ:
    - total_expense
    - total_income
    - list_transactions
    - list_recurring
    - top_spending_category
    - top_income_category
    - compare_income_vs_expense
    - highest_expense
    - highest_income
    - lowest_expense
    - lowest_income
    - spending_by_category
    - saving_summary
    - average_spending_daily_base_on_income
    - average_spending_daily_base_on_expense
    - spending_trend
    - income_trend
    - unknown

    ${prevContext ? `Ngữ cảnh trước đó: intent="${prevContext.intent}", thời gian="${JSON.stringify(prevContext.timeRange)}"` : ""}
    Nếu người dùng đang hỏi follow-up (ví dụ: "vậy còn tháng trước thì sao?"), hãy suy luận intent và thời gian dựa trên ngữ cảnh trước đó.
    Trả về JSON đúng cấu trúc:
    {
      "intent": "income_trend"
    }

    Câu hỏi: "${question}"
    `;


    const intentRaw = await askGemini(intentPrompt);
    const intentData = JSON.parse(intentRaw.replace(/```json|```/g, "").trim());

    // 2️⃣ Phân tích khoảng thời gian
    const timeRange = await extractTimeRange(question);
    const { type, category } = extractTypeAndCategory(question);
    const startDate =
      timeRange?.startDate ??
      new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0];
    const endDate =
      timeRange?.endDate ?? new Date().toISOString().split("T")[0];

    // 3️⃣ Gọi xử lý intent
    const result = await handleIntent({
      intent: intentData.intent,
      userId,
      userToken: token,
      timeRange: { startDate, endDate },
      type,
      category
    });

    try {
      await axios.post(`${process.env.FINTRACK_API_URL}/chat-history`, {
        userId,
        role: "user",
        text: question,
      }, { headers: { Authorization: `Bearer ${token}` } });

      await axios.post(`${process.env.FINTRACK_API_URL}/chat-history`, {
        userId,
        role: "bot",
        text: result.reply,
      }, { headers: { Authorization: `Bearer ${token}` } });

    } catch (error) {
      console.error("⚠️ Lỗi khi lưu chat history:", error);
    }

    // Lưu context
    await saveUserContext(userId, {
      intent: intentData.intent,
      timeRange: { startDate, endDate },
    });

    // 4️⃣ Trả kết quả
    return {
      intent: intentData.intent,
      timeRange: { startDate, endDate },
      result,
    };
  } catch (error) {
    console.error("❌ chatbotService error:", error);
    return {
      intent: "unknown",
      timeRange: null,
      error: error instanceof Error ? error.message : error,
    };
  }
};
