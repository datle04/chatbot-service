// File: src/services/chatbotService.ts
import { normalizeCategory } from "../types/categoryMapper";
import { getUserContext, saveUserContext } from "./contextManager";
import { createFinTrackApiClient } from "./fintrackClient";
import { getExtractedDataFromGemini, ExtractedData } from "./geminiExtractor"; // <-- Dùng file mới
import { handleIntent } from "./intentHandler"; // <-- Dùng file mới

export const chatbotService = async (
  userId: string,
  question: string,
  token: string
) => {
  try {
    const prevContext = await getUserContext(userId);

    const parsedData: ExtractedData = await getExtractedDataFromGemini(
      question,
      prevContext
    );

    // Chuẩn hóa category
    if (parsedData.category_keyword) {
      // 'category' sẽ là key hệ thống (ví dụ: "food")
      parsedData.category = normalizeCategory(parsedData.category_keyword);
    }

    // Gắn thêm token và userId để các handler sử dụng
    parsedData.token = token;
    parsedData.userId = userId;

    // Intent điều phối
    const result = await handleIntent(parsedData);

    // Lưu tin nhắn
    const apiClient = createFinTrackApiClient(token);
    try {
      await Promise.all([
        apiClient.post("/chat-history", { role: "user", text: question }),
        apiClient.post("/chat-history", { role: "bot", text: result.reply }),
      ]);
    } catch (error) {
      console.error("⚠️ Lỗi khi lưu chat history:", error);
    }

    // 4️⃣ Lưu context mới
    await saveUserContext(userId, {
      intent: parsedData.intent,
      timeRange: parsedData.timeRange,
    });

    // 5️⃣ Trả kết quả
    return {
      intent: parsedData.intent,
      timeRange: parsedData.timeRange,
      result,
    };
  } catch (error) {
    console.error("❌ chatbotService error:", error);
  }
};