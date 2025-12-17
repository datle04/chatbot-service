import { GoogleGenerativeAI } from "@google/generative-ai";
import { askGroq } from "./groqService";
import dotenv from "dotenv";

dotenv.config();

// Cấu hình Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Hàm gọi Gemini nội bộ (Đã nâng cấp để hỗ trợ JSON Mode native)
const callGemini = async (prompt: string, isJsonMode: boolean): Promise<string> => {
    // Tùy chọn config dựa trên mode
    const generationConfig = isJsonMode 
        ? { responseMimeType: "application/json" } // Ép Gemini trả về JSON chuẩn
        : undefined;

    // Khởi tạo model (Lưu ý: Flash Lite hỗ trợ tốt JSON mode)
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.0-flash-lite",
        generationConfig: generationConfig
    });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
};

/**
 * Hàm gọi AI thông minh (Smart Wrapper)
 * 1. Thử gọi Gemini trước.
 * 2. Nếu Gemini lỗi (429/503), tự động gọi Groq.
 * * @param prompt Câu hỏi hoặc yêu cầu gửi lên AI
 * @param isJsonMode (Optional) Nếu true, ép AI trả về format JSON chuẩn (Dùng cho NLU)
 */
export const askAI = async (
    prompt: string, 
    isJsonMode: boolean = false // <--- [CẬP NHẬT 1] Thêm tham số này
): Promise<{ text: string; source: "gemini" | "groq" }> => {
    try {
        // [ƯU TIÊN 1] Gọi Gemini
        const text = await callGemini(prompt, isJsonMode);
        return { text, source: "gemini" };
    } catch (error: any) {
        // Kiểm tra lỗi Quota (429) hoặc Server Busy (503)
        const isQuotaError = error.status === 429 || error.message?.includes("429") || error.status === 503;

        if (isQuotaError) {
            console.warn(`⚠️ Gemini Limit Reached (429). Switching to Groq fallback...`);
        } else {
            console.warn(`⚠️ Gemini Error (${error.message}). Switching to Groq fallback...`);
        }

        // [ƯU TIÊN 2] Gọi Groq (Fallback)
        try {
            // [CẬP NHẬT 2] Truyền cờ isJsonMode xuống Groq
            const text = await askGroq(prompt, isJsonMode);
            return { text, source: "groq" };
        } catch (groqError: any) {
            console.error("❌ CRITICAL: Both Gemini and Groq failed!", groqError.message);
            throw new Error("AI Service Unavailable");
        }
    }
};