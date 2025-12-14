// File: src/services/groqService.ts
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

export const askGroq = async (prompt: string): Promise<string> => {
    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    // Llama 3 cần nhắc kỹ việc chỉ trả về JSON
                    content: "You are a helpful JSON extractor. You MUST return ONLY valid JSON. Do not include markdown formatting like ```json or specific explanations."
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.1, // Để thấp để đảm bảo trả về JSON chính xác
            max_tokens: 2048,
        });

        return completion.choices[0]?.message?.content || "";
    } catch (error: any) {
        console.error("❌ Groq API Error:", error.message);
        throw error;
    }
};