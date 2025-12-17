import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Thêm tham số isJsonMode (mặc định là false - trả về văn xuôi)
export const askGroq = async (prompt: string, isJsonMode: boolean = false): Promise<string> => {
    try {
        // 1. Cấu hình Prompt dựa trên mode
        const systemInstruction = isJsonMode
            ? "You are a specialized JSON extractor. You MUST return ONLY valid JSON. Do not include markdown formatting or explanations."
            : "Bạn là FinAI, một trợ lý tài chính thông minh, hài hước và thân thiện. Hãy trả lời ngắn gọn, tự nhiên bằng tiếng Việt. Dùng emoji để sinh động hơn.";

        // 2. Cấu hình độ sáng tạo (Temperature)
        // JSON cần chính xác (0.1), Văn xuôi cần sáng tạo (0.7)
        const temperature = isJsonMode ? 0.1 : 0.7;

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemInstruction },
                { role: "user", content: prompt },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: temperature,
            max_tokens: 2048,
        });

        return completion.choices[0]?.message?.content || "";
    } catch (error: any) {
        console.error("❌ Groq API Error:", error.message);
        throw error;
    }
};