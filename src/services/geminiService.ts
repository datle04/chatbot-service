import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
console.log(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });

// Hàm delay đơn giản
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const askGemini = async (prompt: string, retries = 3): Promise<string> => {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error: any) {
    // Nếu gặp lỗi 429 (Too Many Requests) hoặc 503 (Service Unavailable)
    if ((error.status === 429 || error.status === 503) && retries > 0) {
      console.warn(`⚠️ Gặp lỗi Quota (429/503). Đang chờ 2s để thử lại... (Còn ${retries} lần)`);
      
      // Chờ 2 giây (hoặc tăng dần: 2s, 4s, 8s...)
      await delay(2000 * (4 - retries)); 
      
      // Gọi đệ quy lại hàm này
      return askGemini(prompt, retries - 1);
    }

    // Nếu không phải lỗi 429 hoặc đã hết số lần thử lại -> Ném lỗi ra ngoài
    console.error("❌ Gemini API Error:", error.message);
    throw error;
  }
};