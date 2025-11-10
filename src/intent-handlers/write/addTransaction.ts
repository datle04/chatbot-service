// File: src/intent-handlers/write/addTransaction.ts

import { ExtractedData } from "../../services/geminiExtractor";
import { HandlerResult } from "../../services/intentHandler";
import { createFinTrackApiClient } from "../../services/fintrackClient";
// import { getCurrencyFromUser } from ... // (Bạn cần hàm này)

export const addTransaction = async (
  data: ExtractedData
): Promise<HandlerResult> => {
  const { token, amount, category, description, currency_cue, specificDate } = data;

  // 1. Kiểm tra thông tin bắt buộc
  // (Đây là ví dụ đơn giản, bạn có thể hỏi lại chi tiết hơn)
  if (!amount || !category) {
    // TODO: Lưu context để biết là đang hỏi dở
    return {
      reply: `Tôi cần thêm thông tin. Bạn muốn thêm bao nhiêu tiền và cho danh mục nào? (Ví dụ: 50k Ăn uống)`,
    };
  }

  // 2. Xử lý tiền tệ (Như đã bàn)
  // const userPreferredCurrency = await getCurrencyFromUser(token); // Giả sử
  const userPreferredCurrency = "VND"; // Tạm thời
  let finalAmount = amount;
  let finalCurrency = userPreferredCurrency;

  if (currency_cue === "k" || currency_cue === "vnd") {
    finalCurrency = "VND";
    if (currency_cue === "k") finalAmount *= 1000;
  } else if (currency_cue === "$" || currency_cue === "usd") {
    finalCurrency = "USD";
  }
  // ... (thêm logic cho các tiền tệ khác)

  // 3. Gửi API
  try {
    const apiClient = createFinTrackApiClient(token!);
    await apiClient.post("/transactions", {
      amount: finalAmount,
      currency: finalCurrency,
      category: category,
      note: description || `Giao dịch ${category}`,
      date: specificDate || new Date().toISOString(),
    });

    return {
      reply: `Đã thêm giao dịch: ${finalAmount.toLocaleString()} ${finalCurrency} cho ${category}.`,
    };
  } catch (error) {
    console.error("Lỗi khi thêm giao dịch:", error);
    return {
      reply: "Rất tiếc, tôi không thể thêm giao dịch lúc này. Vui lòng thử lại.",
    };
  }
};