// File: src/intent-handlers/write/addTransaction.ts

import { createFinTrackApiClient } from "../../services/fintrackClient";
import { HandlerResult } from "../../services/intentHandler";
import { ExtractedData } from "../../services/geminiExtractor";
import { normalizeCategory, getCategoryDisplayName } from "../../types/categoryMapper";
import { generateReply } from "../../services/geminiReplyService";

export const addTransaction = async (
  data: ExtractedData
): Promise<HandlerResult> => {
  // Dữ liệu lúc này đã SẠCH và CHUẨN từ AI
  const { token, amount, category, description, currency, transactionDate, type } = data;

  if (!token) return { reply: "Lỗi: Phiên xác thực không hợp lệ." };

  // 1. VALIDATION (Vẫn cần thiết để đảm bảo AI không trả về null)
  if (!amount) {
    return { reply: "Bạn muốn thêm giao dịch bao nhiêu tiền?" };
  }
  if (!category || category === 'other') {
     // Nếu AI trả về 'other', có thể hỏi lại hoặc chấp nhận luôn tùy bạn
     // Ở đây ta chấp nhận luôn, nhưng log warning
  }

  // 2. LOGIC XỬ LÝ (Đã được AI làm giúp 90%)
  // Ngày tháng: Mặc định hôm nay nếu AI trả về null
  const date = transactionDate || new Date().toISOString();
  
  // Loại giao dịch: Nếu AI chưa đoán được, mặc định expense
  const finalType = type || "expense"; 

  try {
    const apiClient = createFinTrackApiClient(token);

    // 3. GỌI API (Gửi thẳng dữ liệu đã chuẩn hóa)
    const res = await apiClient.post("/transaction", {
      amount: amount,       // AI đã đổi 50k -> 50000
      category: category,   // AI đã đổi "cà phê" -> "food"
      currency: currency || "VND", // AI đã đổi "đô" -> "USD"
      date: date,
      note: description || "Giao dịch mới",
      type: finalType,
    });

    const createdTransaction = res.data.transaction;

    // 4. GỌI REPLY SERVICE
    const replyString = await generateReply("add_transaction", createdTransaction, null);

    return {
      reply: replyString,
      data: createdTransaction 
    };

  } catch (error) {
    console.error("Lỗi add transaction:", error);
    return { reply: "Rất tiếc, đã có lỗi xảy ra khi lưu giao dịch." };
  }
};