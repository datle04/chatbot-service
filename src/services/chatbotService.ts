import { normalizeCategory } from "../types/categoryMapper";
import { getUserContext, saveUserContext } from "./contextManager";
import { createFinTrackApiClient } from "./fintrackClient";
import { getExtractedDataFromAI, ExtractedData } from "./geminiExtractor"; // <-- Import từ file mới
import { handleIntent } from "./intentHandler";

export const chatbotService = async (
  userId: string,
  question: string,
  token: string
) => {
  try {
    const prevContext = await getUserContext(userId);

    // Gọi hàm Extractor mới (Đã tích hợp Gemini + Groq)
    const parsedData: ExtractedData = await getExtractedDataFromAI(
      question,
      prevContext
    );

    // [Optional] Log cảnh báo nếu đang chạy chế độ Backup (Groq)
    if (parsedData._ai_source === 'groq') {
        console.log("🚀 [System info] Request đang được xử lý bởi Groq (Do Gemini quá tải)");
    }

    // --- CÁC PHẦN DƯỚI ĐÂY GIỮ NGUYÊN ---

    // Chuẩn hóa category
    if (parsedData.category_keyword) {
      parsedData.category = normalizeCategory(parsedData.category_keyword);
    }

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
      console.error("⚠️ Lỗi lưu chat history:", error);
    }

    // Lưu context mới
    await saveUserContext(userId, {
      intent: parsedData.intent,
      timeRange: parsedData.timeRange,
    });

    return {
      intent: parsedData.intent,
      timeRange: parsedData.timeRange,
      result,
      source: parsedData._ai_source // Trả về để Frontend biết (nếu cần)
    };
  } catch (error) {
    console.error("❌ chatbotService error:", error);
    // Có thể return một câu lỗi thân thiện
    return {
        intent: "error",
        result: { reply: "Hệ thống đang bận, vui lòng thử lại sau giây lát." }
    };
  }
};