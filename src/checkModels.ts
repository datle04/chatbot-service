// check_models.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Khởi tạo tạm
    // Gọi API lấy danh sách
    // Lưu ý: SDK cũ có thể không có method này, nếu lỗi thì chứng tỏ SDK quá cũ
    console.log("Đang lấy danh sách model...");
    // Hack: Hiện tại SDK nodejs không export trực tiếp listModels dễ dàng, 
    // ta thử gọi model cũ xem nó gợi ý gì, hoặc dùng fetch trực tiếp:
    
    const apiKey = process.env.GEMINI_API_KEY;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    console.log("--- DANH SÁCH MODEL CÓ SẴN ---");
    if (data.models) {
        data.models.forEach((m: any) => {
            console.log(`✅ ${m.name.replace("models/", "")}`);
        });
    } else {
        console.log("Lỗi:", data);
    }

  } catch (error) {
    console.error("Lỗi:", error);
  }
}

listModels();