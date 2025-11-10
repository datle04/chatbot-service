"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askGemini = void 0;
// src/services/geminiService.ts
const generative_ai_1 = require("@google/generative-ai");
const genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const askGemini = async (prompt) => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);
        return result.response.text();
    }
    catch (error) {
        console.error("❌ Gemini API Error:", error);
        return "Xin lỗi, hệ thống đang gặp chút sự cố khi trả lời 🥲";
    }
};
exports.askGemini = askGemini;
